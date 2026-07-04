import { Router } from "express";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { captureServerEvent, getPostHogDistinctId } from "../../lib/analytics";
import { writeAudit } from "../../lib/audit";
import { insertRow, selectRows } from "../../lib/supabaseAdmin";
import { adminSession } from "../../middleware/adminAuth";

const inviteSchema = z.object({
  username: z.string().trim().min(3).max(24),
  count: z.number().int().min(1).max(100),
});

function makeInviteCode() {
  return `RAW-1-${randomBytes(5).toString("hex").toUpperCase()}`;
}

export const invitesRouter = Router();

invitesRouter.post("/grant-invite-codes", async (req, res) => {
  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  const users = await selectRows<{ id: string; username: string }>("users", {
    select: "id,username",
    username: `ilike.${parsed.data.username}`,
    limit: 1,
  });
  const target = users[0];
  if (!target) return res.status(404).json({ error: "user_not_found" });

  const codes: string[] = [];
  for (let index = 0; index < parsed.data.count; index += 1) {
    const code = makeInviteCode();
    await insertRow("founding_invites", { inviter_id: target.id, code });
    codes.push(code);
  }

  const session = adminSession(res);
  writeAudit(session, {
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
