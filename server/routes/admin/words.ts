import { Router } from "express";
import { z } from "zod";
import { captureServerEvent, getPostHogDistinctId } from "../../lib/analytics";
import { writeAudit } from "../../lib/audit";
import { deleteRows, insertRow, selectRows } from "../../lib/supabaseAdmin";
import { adminSession } from "../../middleware/adminAuth";

type BlockedWordRow = {
  id: string;
  term: string;
  normalized_term: string;
  created_at: string;
  created_by: string | null;
};

type BannedWordRow = {
  id: string;
  word: string;
  normalized_word: string;
  action: string | null;
  category: string | null;
  added_by: string | null;
  created_at: string;
};

const blockedWordSchema = z.object({
  term: z.string().trim().min(1).max(120),
});

const bannedWordSchema = z.object({
  word: z.string().trim().min(1).max(120),
  action: z.enum(["block", "flag", "shadow"]).default("flag"),
  category: z.string().trim().max(60).optional(),
});

const idSchema = z.object({ id: z.string().uuid() });

function mapBlockedWord(row: BlockedWordRow) {
  return {
    id: row.id,
    term: row.term,
    normalizedTerm: row.normalized_term,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

function mapBannedWord(row: BannedWordRow) {
  return {
    id: row.id,
    word: row.word,
    normalizedWord: row.normalized_word,
    action: row.action,
    category: row.category,
    addedBy: row.added_by,
    createdAt: row.created_at,
  };
}

export const wordsRouter = Router();

// Blocked words keep their original paths/shapes.
wordsRouter.get("/blocked-words", async (_req, res) => {
  const rows = await selectRows<BlockedWordRow>("blocked_words", {
    select: "id,term,normalized_term,created_at,created_by",
    order: "normalized_term.asc",
  });
  return res.status(200).json({ blockedWords: rows.map(mapBlockedWord) });
});

wordsRouter.post("/blocked-words", async (req, res) => {
  const parsed = blockedWordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  const session = adminSession(res);
  const row = await insertRow<BlockedWordRow>("blocked_words", {
    term: parsed.data.term,
    created_by: session.userId,
  });
  writeAudit(session, { action: "blocked_word_added", targetType: "blocked_word", targetId: row.id, targetLabel: row.term });
  captureServerEvent(req, "admin_blocked_word_added_server", getPostHogDistinctId(req, session.userId));
  return res.status(200).json({ blockedWord: mapBlockedWord(row) });
});

wordsRouter.delete("/blocked-words", async (req, res) => {
  const parsed = idSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  await deleteRows("blocked_words", { id: `eq.${parsed.data.id}` });
  const session = adminSession(res);
  writeAudit(session, { action: "blocked_word_removed", targetType: "blocked_word", targetId: parsed.data.id });
  captureServerEvent(req, "admin_blocked_word_removed_server", getPostHogDistinctId(req, session.userId));
  return res.status(200).json({ ok: true });
});

wordsRouter.get("/banned-words", async (_req, res) => {
  const rows = await selectRows<BannedWordRow>("banned_words", {
    select: "id,word,normalized_word,action,category,added_by,created_at",
    order: "normalized_word.asc",
  });
  return res.status(200).json({ bannedWords: rows.map(mapBannedWord) });
});

wordsRouter.post("/banned-words", async (req, res) => {
  const parsed = bannedWordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  const session = adminSession(res);
  const row = await insertRow<BannedWordRow>("banned_words", {
    word: parsed.data.word,
    normalized_word: parsed.data.word.toLowerCase(),
    action: parsed.data.action,
    category: parsed.data.category ?? null,
    added_by: session.username,
  });
  writeAudit(session, {
    action: "banned_word_added",
    targetType: "banned_word",
    targetId: row.id,
    targetLabel: row.word,
    details: { action: parsed.data.action, category: parsed.data.category ?? null },
  });
  return res.status(200).json({ bannedWord: mapBannedWord(row) });
});

wordsRouter.delete("/banned-words", async (req, res) => {
  const parsed = idSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  await deleteRows("banned_words", { id: `eq.${parsed.data.id}` });
  writeAudit(adminSession(res), { action: "banned_word_removed", targetType: "banned_word", targetId: parsed.data.id });
  return res.status(200).json({ ok: true });
});
