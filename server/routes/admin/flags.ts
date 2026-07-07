import { Router } from "express";
import { z } from "zod";
import { writeAudit } from "../../lib/audit.js";
import { selectRows, updateRows } from "../../lib/supabaseAdmin.js";
import { adminSession } from "../../middleware/adminAuth.js";

type FlagRow = {
  id: string;
  message_id: string | null;
  community_id: string | null;
  sender_id: string | null;
  matched_word: string | null;
  reason: string | null;
  verdict: string | null;
  ai_score: number | null;
  reviewed: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

const flagsQuerySchema = z.object({
  reviewed: z.enum(["true", "false", "all"]).default("false"),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

const reviewSchema = z.object({
  verdict: z.enum(["violation", "ok", "unclear"]).optional(),
});

export const flagsRouter = Router();

flagsRouter.get("/flags", async (req, res) => {
  const parsed = flagsQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "invalid_query" });

  const params: Record<string, string | number> = {
    select: "id,message_id,community_id,sender_id,matched_word,reason,verdict,ai_score,reviewed,reviewed_by,reviewed_at,created_at",
    order: "created_at.desc",
    limit: parsed.data.limit,
  };
  if (parsed.data.reviewed !== "all") params.reviewed = `eq.${parsed.data.reviewed}`;

  const rows = await selectRows<FlagRow>("moderation_flags", params);
  return res.status(200).json({
    flags: rows.map((row) => ({
      id: row.id,
      messageId: row.message_id,
      communityId: row.community_id,
      senderId: row.sender_id,
      matchedWord: row.matched_word,
      reason: row.reason,
      verdict: row.verdict,
      aiScore: row.ai_score,
      reviewed: row.reviewed,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      createdAt: row.created_at,
    })),
  });
});

flagsRouter.patch("/flags/:id", async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  const session = adminSession(res);
  const rows = await updateRows<FlagRow>(
    "moderation_flags",
    { id: `eq.${req.params.id}` },
    {
      reviewed: true,
      reviewed_by: session.username,
      reviewed_at: new Date().toISOString(),
      ...(parsed.data.verdict ? { verdict: parsed.data.verdict } : {}),
    },
  );
  if (rows.length === 0) return res.status(404).json({ error: "flag_not_found" });

  await writeAudit(session, {
    action: "flag_reviewed",
    targetType: "moderation_flag",
    targetId: req.params.id,
    details: { verdict: parsed.data.verdict ?? rows[0].verdict },
  });
  return res.status(200).json({ ok: true });
});
