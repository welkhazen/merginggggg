import { Router } from "express";
import { z } from "zod";
import { insertRow } from "../lib/supabaseAdmin.js";

const waitlistSchema = z.object({
  contact: z.string().trim().min(1).max(120),
  note: z.string().trim().max(240).optional(),
  source: z.string().trim().max(60).default("signup_modal"),
});

export const waitlistRouter = Router();

waitlistRouter.post("/invite", async (req, res) => {
  const parsed = waitlistSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  await insertRow("invite_waitlist_requests", {
    contact: parsed.data.contact,
    // note is NOT NULL with default '' on the live table, so never insert null.
    note: parsed.data.note?.trim() || "",
    source: parsed.data.source || "signup_modal",
  });

  return res.status(200).json({ ok: true });
});
