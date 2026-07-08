import { Router } from "express";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { captureServerEvent, getPostHogDistinctId } from "../../lib/analytics.js";
import { writeAudit } from "../../lib/audit.js";
import { insertRows, selectRows, updateRows } from "../../lib/supabaseAdmin.js";
import { adminSession } from "../../middleware/adminAuth.js";

const inviteSchema = z.object({
  username: z.string().trim().min(3).max(24),
  count: z.number().int().min(1).max(100),
});

type WaitlistRequestRow = {
  id: string;
  contact: string;
  note: string;
  source: string;
  submitted_at: string;
  status: string;
};

const waitlistQuerySchema = z.object({
  status: z.enum(["pending", "contacted", "sent_code", "closed", "all"]).default("pending"),
});

const waitlistUpdateSchema = z.object({
  status: z.enum(["pending", "contacted", "sent_code", "closed"]),
});

function makeInviteCode() {
  return `RAW-1-${randomBytes(5).toString("hex").toUpperCase()}`;
}

export const invitesRouter = Router();

invitesRouter.post("/grant-invite-codes", async (req, res) => {
  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  const safe = parsed.data.username.replace(/[%_*,()\\]/g, "");
  const users = safe
    ? await selectRows<{ id: string; username: string }>("users", {
        select: "id,username",
        username: `ilike.${safe}`,
        limit: 5,
      })
    : [];
  const target = users.find((row) => row.username.toLowerCase() === parsed.data.username.toLowerCase());
  if (!target) return res.status(404).json({ error: "user_not_found" });

  // One bulk insert so the whole grant succeeds or fails together.
  const codes = Array.from({ length: parsed.data.count }, () => makeInviteCode());
  await insertRows(
    "founding_invites",
    codes.map((code) => ({ inviter_id: target.id, code })),
  );

  const session = adminSession(res);
  await writeAudit(session, {
    action: "invite_codes_granted",
    targetType: "user",
    targetId: target.id,
    targetLabel: target.username,
    details: { count: codes.length },
  });
  captureServerEvent(req, "admin_invite_codes_granted_server", getPostHogDistinctId(req, session.userId), {
    amount: codes.length,
  });
  return res.status(200).json({ codes });
});

// Signup waitlist: invite requests submitted from the user app's signup modal
// (invite_waitlist_requests). Contact info is private, hence admin tier.
invitesRouter.get("/waitlist-requests", async (req, res) => {
  const parsed = waitlistQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "invalid_query" });

  const params: Record<string, string | number> = {
    select: "id,contact,note,source,submitted_at,status",
    order: "submitted_at.desc",
    limit: 200,
  };
  if (parsed.data.status !== "all") params.status = `eq.${parsed.data.status}`;

  const rows = await selectRows<WaitlistRequestRow>("invite_waitlist_requests", params);
  return res.status(200).json({
    requests: rows.map((row) => ({
      id: row.id,
      contact: row.contact,
      note: row.note,
      source: row.source,
      submittedAt: row.submitted_at,
      status: row.status,
    })),
  });
});

invitesRouter.patch("/waitlist-requests/:id", async (req, res) => {
  const parsed = waitlistUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  const rows = await updateRows<WaitlistRequestRow>(
    "invite_waitlist_requests",
    { id: `eq.${req.params.id}` },
    { status: parsed.data.status },
  );
  if (rows.length === 0) return res.status(404).json({ error: "request_not_found" });

  const session = adminSession(res);
  await writeAudit(session, {
    action: "waitlist_request_updated",
    targetType: "waitlist_request",
    targetId: String(req.params.id),
    targetLabel: rows[0].contact,
    details: { status: parsed.data.status },
  });
  return res.status(200).json({ ok: true });
});

invitesRouter.get("/invite-redemptions", async (_req, res) => {
  const rows = await selectRows<{
    id: string;
    inviter_id: string | null;
    code: string;
    redeemed_by: string | null;
    redeemed_username: string | null;
    created_at: string;
  }>("founding_invite_redemptions", {
    select: "id,inviter_id,code,redeemed_by,redeemed_username,created_at",
    order: "created_at.desc",
    limit: 100,
  });
  return res.status(200).json({
    redemptions: rows.map((row) => ({
      id: row.id,
      inviterId: row.inviter_id,
      code: row.code,
      redeemedBy: row.redeemed_by,
      redeemedUsername: row.redeemed_username,
      createdAt: row.created_at,
    })),
  });
});
