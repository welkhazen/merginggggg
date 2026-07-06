import { Router } from "express";
import { z } from "zod";
import { captureServerEvent, getPostHogDistinctId } from "../../lib/analytics.js";
import { writeAudit } from "../../lib/audit.js";
import { resolveTier, TIER_RANK } from "../../lib/roles.js";
import { insertRow, selectRows, updateRows } from "../../lib/supabaseAdmin.js";
import { adminSession, requireTier } from "../../middleware/adminAuth.js";

type DbUser = {
  id: string;
  username: string;
  role: string;
  staff_tier: string | null;
  status: string;
  warnings: number | null;
  moderation_status: string | null;
  banned_until: string | null;
  token_balance: number | null;
  avatar_level: number | null;
  spam_strikes: number | null;
  created_at: string;
  last_seen_at: string | null;
  last_moderated_at: string | null;
};

const USER_SELECT =
  "id,username,role,staff_tier,status,warnings,moderation_status,banned_until,token_balance,avatar_level,spam_strikes,created_at,last_seen_at,last_moderated_at";

const usersQuerySchema = z.object({
  q: z.string().trim().max(48).optional(),
  status: z.enum(["active", "warned", "banned", "all"]).default("all"),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

const moderateSchema = z.object({
  username: z.string().trim().min(3).max(24),
  action: z.enum(["warn", "timeout", "ban", "unban"]),
  minutes: z.number().int().min(1).max(60 * 24 * 30).optional(),
  reason: z.string().trim().max(300).optional(),
});

const appealSchema = z.object({
  status: z.enum(["approved", "denied"]),
});

function mapUser(row: DbUser) {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    tier: resolveTier(row),
    status: row.status,
    warnings: row.warnings ?? 0,
    moderationStatus: row.moderation_status,
    bannedUntil: row.banned_until,
    tokenBalance: row.token_balance ?? 0,
    avatarLevel: row.avatar_level ?? 0,
    spamStrikes: row.spam_strikes ?? 0,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    lastModeratedAt: row.last_moderated_at,
  };
}

async function findUserByUsername(username: string) {
  // ilike patterns treat % and _ as wildcards, so a crafted "username" could
  // target the wrong account. Strip pattern characters for the query, then
  // require an exact case-insensitive match on the result.
  const safe = username.replace(/[%_*,()\\]/g, "");
  if (!safe) return null;
  const rows = await selectRows<DbUser>("users", {
    select: USER_SELECT,
    username: `ilike.${safe}`,
    limit: 5,
  });
  return rows.find((row) => row.username.toLowerCase() === username.toLowerCase()) ?? null;
}

export const usersRouter = Router();

usersRouter.get("/users", requireTier("admin"), async (req, res) => {
  const parsed = usersQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "invalid_query" });

  const params: Record<string, string | number> = {
    select: USER_SELECT,
    order: "created_at.desc",
    limit: parsed.data.limit,
    offset: parsed.data.offset,
  };
  if (parsed.data.q) params.username = `ilike.*${parsed.data.q.replace(/[%_*,()\\]/g, "")}*`;
  // Warnings set moderation_status while status stays "active".
  if (parsed.data.status === "warned") params.moderation_status = "eq.warned";
  else if (parsed.data.status !== "all") params.status = `eq.${parsed.data.status}`;

  const rows = await selectRows<DbUser>("users", params);
  return res.status(200).json({ users: rows.map(mapUser) });
});

usersRouter.get("/users/:id", requireTier("admin"), async (req, res) => {
  const rows = await selectRows<DbUser>("users", {
    select: USER_SELECT,
    id: `eq.${req.params.id}`,
    limit: 1,
  });
  const user = rows[0];
  if (!user) return res.status(404).json({ error: "user_not_found" });

  const [safetyScores, actions, appeals] = await Promise.all([
    selectRows<{ score: number; total_flags: number; total_reports_against: number; total_actions: number }>(
      "user_safety_scores",
      { select: "score,total_flags,total_reports_against,total_actions", user_id: `eq.${user.id}`, limit: 1 },
    ),
    selectRows<{ id: string; action: string; reason: string | null; actor_id: string; community_id: string | null; expires_at: string | null; created_at: string }>(
      "moderation_actions",
      {
        select: "id,action,reason,actor_id,community_id,expires_at,created_at",
        target_user_id: `eq.${user.id}`,
        order: "created_at.desc",
        limit: 25,
      },
    ),
    selectRows<{ id: string; text: string; status: string; reviewed_by: string | null; created_at: string }>("appeals", {
      select: "id,text,status,reviewed_by,created_at",
      user_id: `eq.${user.id}`,
      order: "created_at.desc",
      limit: 10,
    }),
  ]);

  return res.status(200).json({
    user: mapUser(user),
    safetyScore: safetyScores[0] ?? null,
    actions: actions.map((action) => ({
      id: action.id,
      action: action.action,
      reason: action.reason,
      actorId: action.actor_id,
      communityId: action.community_id,
      expiresAt: action.expires_at,
      createdAt: action.created_at,
    })),
    appeals: appeals.map((appeal) => ({
      id: appeal.id,
      text: appeal.text,
      status: appeal.status,
      reviewedBy: appeal.reviewed_by,
      createdAt: appeal.created_at,
    })),
  });
});

// Kept at its original path so existing clients keep working.
usersRouter.post("/moderate-user", async (req, res) => {
  const parsed = moderateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  const session = adminSession(res);
  const target = await findUserByUsername(parsed.data.username);
  if (!target) return res.status(404).json({ error: "user_not_found" });

  // Staff can only be moderated by a strictly higher tier.
  const targetTier = resolveTier(target);
  if (targetTier && TIER_RANK[targetTier] >= TIER_RANK[session.tier]) {
    return res.status(403).json({ error: "cannot_moderate_staff" });
  }

  const now = new Date();
  const updates =
    parsed.data.action === "warn"
      ? { moderation_status: "warned", warnings: (target.warnings ?? 0) + 1, last_moderated_at: now.toISOString() }
      : parsed.data.action === "timeout"
        ? {
            status: "banned",
            moderation_status: "banned",
            banned_until: new Date(now.getTime() + (parsed.data.minutes ?? 10) * 60 * 1000).toISOString(),
            last_moderated_at: now.toISOString(),
          }
        : parsed.data.action === "ban"
          ? { status: "banned", moderation_status: "banned", banned_until: null, last_moderated_at: now.toISOString() }
          : { status: "active", moderation_status: "active", banned_until: null, last_moderated_at: now.toISOString() };

  await updateRows("users", { id: `eq.${target.id}` }, updates);

  // Awaited so serverless invocations can't drop the history write; a failure
  // here still must not undo the applied moderation.
  await insertRow("moderation_actions", {
    target_user_id: target.id,
    actor_id: session.userId,
    action: parsed.data.action,
    reason: parsed.data.reason ?? null,
    expires_at:
      parsed.data.action === "timeout"
        ? new Date(now.getTime() + (parsed.data.minutes ?? 10) * 60 * 1000).toISOString()
        : null,
  }).catch((error) => console.error("[moderation] failed to record action", error));

  await writeAudit(session, {
    action: `user_${parsed.data.action}`,
    targetType: "user",
    targetId: target.id,
    targetLabel: target.username,
    details: { minutes: parsed.data.minutes ?? null, reason: parsed.data.reason ?? null },
  });
  captureServerEvent(req, "admin_user_moderated_server", getPostHogDistinctId(req, session.userId), {
    action: parsed.data.action,
    minutes: parsed.data.minutes,
    target_role: target.role,
  });
  return res.status(200).json({ ok: true });
});

usersRouter.get("/appeals", requireTier("admin"), async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : "pending";
  const params: Record<string, string | number> = {
    select: "id,user_id,action_id,text,status,reviewed_by,reviewed_at,created_at",
    order: "created_at.desc",
    limit: 100,
  };
  if (status !== "all") params.status = `eq.${status}`;

  const rows = await selectRows<{
    id: string;
    user_id: string;
    action_id: string | null;
    text: string;
    status: string;
    reviewed_by: string | null;
    reviewed_at: string | null;
    created_at: string;
  }>("appeals", params);
  return res.status(200).json({
    appeals: rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      actionId: row.action_id,
      text: row.text,
      status: row.status,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      createdAt: row.created_at,
    })),
  });
});

usersRouter.patch("/appeals/:id", requireTier("admin"), async (req, res) => {
  const parsed = appealSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  const session = adminSession(res);
  const rows = await updateRows<{ id: string; user_id: string }>(
    "appeals",
    { id: `eq.${req.params.id}` },
    { status: parsed.data.status, reviewed_by: session.username, reviewed_at: new Date().toISOString() },
  );
  if (rows.length === 0) return res.status(404).json({ error: "appeal_not_found" });

  await writeAudit(session, {
    action: "appeal_reviewed",
    targetType: "appeal",
    targetId: String(req.params.id),
    details: { status: parsed.data.status, userId: rows[0].user_id },
  });
  return res.status(200).json({ ok: true });
});
