import { Router } from "express";
import { z } from "zod";
import { captureServerEvent, getPostHogDistinctId } from "../../lib/analytics";
import { writeAudit } from "../../lib/audit";
import type { StaffTier } from "../../lib/roles";
import { resolveTier, roleForTier, STAFF_TIERS, TIER_RANK } from "../../lib/roles";
import { deleteRows, rpc, selectRows, updateRows } from "../../lib/supabaseAdmin";
import { adminSession } from "../../middleware/adminAuth";

type DbUser = {
  id: string;
  username: string;
  role: string;
  staff_tier: string | null;
  status: string;
  created_at: string;
  last_seen_at: string | null;
};

const createStaffSchema = z.object({
  username: z.string().trim().min(3).max(24),
  password: z.string().min(12).max(128),
  tier: z.enum(STAFF_TIERS),
});

const tierUpdateSchema = z.object({
  userId: z.string().uuid(),
  tier: z.enum(STAFF_TIERS).nullable(),
});

function canAssign(actorTier: StaffTier, tier: StaffTier): boolean {
  // Only super admins can mint owners or other super admins.
  if (TIER_RANK[tier] >= TIER_RANK.owner) return actorTier === "super_admin";
  return true;
}

export const staffRouter = Router();

staffRouter.get("/staff", async (_req, res) => {
  const rows = await selectRows<DbUser>("users", {
    select: "id,username,role,staff_tier,status,created_at,last_seen_at",
    or: "(staff_tier.not.is.null,role.in.(admin,moderator))",
    order: "created_at.asc",
  });
  return res.status(200).json({
    staff: rows.map((row) => ({
      id: row.id,
      username: row.username,
      role: row.role,
      tier: resolveTier(row),
      status: row.status,
      createdAt: row.created_at,
      lastSeenAt: row.last_seen_at,
    })),
  });
});

// Kept at its original path; the payload's role field now accepts any tier.
staffRouter.post("/create-staff-account", async (req, res) => {
  const body = { ...req.body, tier: req.body?.tier ?? req.body?.role };
  const parsed = createStaffSchema.safeParse(body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  const session = adminSession(res);
  if (!canAssign(session.tier, parsed.data.tier)) {
    return res.status(403).json({ error: "insufficient_tier" });
  }

  let createdId: string | null = null;
  try {
    const id = await rpc<string>("create_user_with_password", {
      p_username: parsed.data.username,
      p_password: parsed.data.password,
    });
    createdId = id;
    await updateRows(
      "users",
      { id: `eq.${id}` },
      { role: roleForTier(parsed.data.tier), staff_tier: parsed.data.tier, status: "active" },
    );
    await writeAudit(session, {
      action: "staff_account_created",
      targetType: "user",
      targetId: id,
      targetLabel: parsed.data.username,
      details: { tier: parsed.data.tier },
    });
    captureServerEvent(req, "admin_staff_account_created_server", getPostHogDistinctId(req, session.userId), {
      tier: parsed.data.tier,
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    // Roll back a half-created account so retrying doesn't hit username_taken.
    if (createdId) {
      await deleteRows("users", { id: `eq.${createdId}` }).catch((cleanupError) =>
        console.error("[staff] failed to roll back partial account", cleanupError),
      );
    }
    const message = error instanceof Error && error.message.includes("username") ? "username_taken" : "create_failed";
    return res.status(message === "username_taken" ? 409 : 500).json({ error: message });
  }
});

staffRouter.patch("/staff/tier", async (req, res) => {
  const parsed = tierUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  const session = adminSession(res);
  if (parsed.data.userId === session.userId) {
    return res.status(403).json({ error: "cannot_change_own_tier" });
  }

  const rows = await selectRows<DbUser>("users", {
    select: "id,username,role,staff_tier,status,created_at,last_seen_at",
    id: `eq.${parsed.data.userId}`,
    limit: 1,
  });
  const target = rows[0];
  if (!target) return res.status(404).json({ error: "user_not_found" });

  const targetTier = resolveTier(target);
  if (targetTier && TIER_RANK[targetTier] >= TIER_RANK[session.tier]) {
    return res.status(403).json({ error: "cannot_modify_equal_or_higher_tier" });
  }
  if (parsed.data.tier && !canAssign(session.tier, parsed.data.tier)) {
    return res.status(403).json({ error: "insufficient_tier" });
  }
  if (parsed.data.tier && TIER_RANK[parsed.data.tier] > TIER_RANK[session.tier]) {
    return res.status(403).json({ error: "cannot_assign_above_own_tier" });
  }

  await updateRows(
    "users",
    { id: `eq.${target.id}` },
    parsed.data.tier
      ? { staff_tier: parsed.data.tier, role: roleForTier(parsed.data.tier) }
      : { staff_tier: null, role: "user" },
  );

  await writeAudit(session, {
    action: parsed.data.tier ? "staff_tier_changed" : "staff_tier_revoked",
    targetType: "user",
    targetId: target.id,
    targetLabel: target.username,
    details: { from: targetTier, to: parsed.data.tier },
  });
  captureServerEvent(req, "admin_staff_tier_changed_server", getPostHogDistinctId(req, session.userId), {
    to: parsed.data.tier,
  });
  return res.status(200).json({ ok: true });
});
