import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { deleteRows, insertRow, rpc, selectRows, updateRows } from "../lib/supabaseAdmin";
import type { AuthSessionData } from "../types";

type StaffRole = "admin" | "moderator";

type DbUser = {
  id: string;
  username: string;
  role: StaffRole | "member" | "user";
  status: string;
  warnings: number | null;
};

type BlockedWordRow = {
  id: string;
  term: string;
  normalized_term: string;
  created_at: string;
  created_by: string | null;
};

type DonationInterestRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  submitted_at: string;
  status: "pending" | "reviewed";
};

const usernameSchema = z.string().trim().min(3).max(24);

const moderateSchema = z.object({
  username: usernameSchema,
  action: z.enum(["warn", "timeout", "ban", "unban"]),
  minutes: z.number().int().min(1).max(60 * 24 * 30).optional(),
});

const staffSchema = z.object({
  username: usernameSchema,
  password: z.string().min(6).max(128),
  role: z.enum(["admin", "moderator"]),
});

const inviteSchema = z.object({
  username: usernameSchema,
  count: z.number().int().min(1).max(100),
});

const blockedWordSchema = z.object({
  term: z.string().trim().min(1).max(120),
});

const idSchema = z.object({
  id: z.string().uuid(),
});

const donationStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "reviewed"]),
});

function session(req: Request): AuthSessionData {
  return req.session as unknown as AuthSessionData;
}

function requireStaff(req: Request, res: Response, next: NextFunction) {
  const data = session(req);
  if (!data.userId || (data.role !== "admin" && data.role !== "moderator")) {
    return res.status(401).json({ error: "Authentication required." });
  }
  return next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const data = session(req);
  if (!data.userId || data.role !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
  }
  return next();
}

function mapBlockedWord(row: BlockedWordRow) {
  return {
    id: row.id,
    term: row.term,
    normalizedTerm: row.normalized_term,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

function mapDonation(row: DonationInterestRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    submittedAt: row.submitted_at,
    status: row.status,
  };
}

async function findUserByUsername(username: string) {
  const rows = await selectRows<DbUser>("users", {
    select: "id,username,role,status,warnings",
    username: `ilike.${username}`,
    limit: 1,
  });
  return rows[0] ?? null;
}

function makeInviteCode() {
  return `RAW-1-${randomBytes(5).toString("hex").toUpperCase()}`;
}

export const adminRouter = Router();

adminRouter.use(requireStaff);

adminRouter.post("/moderate-user", async (req, res) => {
  const parsed = moderateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  const target = await findUserByUsername(parsed.data.username);
  if (!target) return res.status(404).json({ error: "user_not_found" });
  if (target.role === "admin" || target.role === "moderator") {
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
  return res.status(200).json({ ok: true });
});

adminRouter.post("/create-staff-account", requireAdmin, async (req, res) => {
  const parsed = staffSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  try {
    const id = await rpc<string>("create_user_with_password", {
      p_username: parsed.data.username,
      p_password: parsed.data.password,
    });
    await updateRows("users", { id: `eq.${id}` }, { role: parsed.data.role, status: "active" });
    return res.status(200).json({ ok: true });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("username") ? "username_taken" : "create_failed";
    return res.status(message === "username_taken" ? 409 : 500).json({ error: message });
  }
});

adminRouter.post("/grant-invite-codes", requireAdmin, async (req, res) => {
  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  const target = await findUserByUsername(parsed.data.username);
  if (!target) return res.status(404).json({ error: "user_not_found" });

  const codes: string[] = [];
  for (let index = 0; index < parsed.data.count; index += 1) {
    const code = makeInviteCode();
    await insertRow("founding_invites", { inviter_id: target.id, code });
    codes.push(code);
  }
  return res.status(200).json({ codes });
});

adminRouter.get("/blocked-words", requireAdmin, async (_req, res) => {
  const rows = await selectRows<BlockedWordRow>("blocked_words", {
    select: "id,term,normalized_term,created_at,created_by",
    order: "normalized_term.asc",
  });
  return res.status(200).json({ blockedWords: rows.map(mapBlockedWord) });
});

adminRouter.post("/blocked-words", requireAdmin, async (req, res) => {
  const parsed = blockedWordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  const row = await insertRow<BlockedWordRow>("blocked_words", {
    term: parsed.data.term,
    created_by: session(req).userId,
  });
  return res.status(200).json({ blockedWord: mapBlockedWord(row) });
});

adminRouter.delete("/blocked-words", requireAdmin, async (req, res) => {
  const parsed = idSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  await deleteRows("blocked_words", { id: `eq.${parsed.data.id}` });
  return res.status(200).json({ ok: true });
});

adminRouter.get("/donation-interests", requireAdmin, async (_req, res) => {
  const rows = await selectRows<DonationInterestRow>("donation_interests", {
    select: "id,name,email,phone,submitted_at,status",
    order: "submitted_at.desc",
  });
  return res.status(200).json({ requests: rows.map(mapDonation) });
});

adminRouter.patch("/donation-interests", requireAdmin, async (req, res) => {
  const parsed = donationStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  await updateRows("donation_interests", { id: `eq.${parsed.data.id}` }, { status: parsed.data.status });
  return res.status(200).json({ ok: true });
});

adminRouter.delete("/donation-interests", requireAdmin, async (req, res) => {
  const parsed = idSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  await deleteRows("donation_interests", { id: `eq.${parsed.data.id}` });
  return res.status(200).json({ ok: true });
});
