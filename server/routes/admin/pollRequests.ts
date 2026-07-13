import { Router } from "express";
import { z } from "zod";
import { writeAudit } from "../../lib/audit.js";
import { insertRow, insertRows, selectRows, updateRows } from "../../lib/supabaseAdmin.js";
import { adminSession, requireTier } from "../../middleware/adminAuth.js";

type PollRequestRow = {
  id: string;
  requester_id: string | null;
  requester_name: string | null;
  question: string;
  options: unknown;
  note: string | null;
  submitted_at: string;
  status: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

const requestsQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "all"]).default("pending"),
});

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

const SELECT =
  "id,requester_id,requester_name,question,options,note,submitted_at,status,reviewed_at,reviewed_by";

// Options are stored as a jsonb array of label strings; be defensive about shape.
function readOptionLabels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((o) => (typeof o === "string" ? o : typeof (o as { text?: string })?.text === "string" ? (o as { text: string }).text : ""))
    .map((s) => s.trim())
    .filter(Boolean);
}

// Poll ids are human-readable slugs (e.g. "instagram-poll-001"). Derive one from
// the question and pick a free variant so approving twice can't collide.
function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "poll"
  );
}

async function createPollFromRequest(request: PollRequestRow): Promise<string> {
  const base = slugify(request.question);
  const taken = new Set(
    (await selectRows<{ id: string }>("polls", { select: "id", id: `like.${base}*`, limit: 100 })).map((r) => r.id),
  );
  let id = base;
  for (let i = 2; taken.has(id); i += 1) id = `${base}-${i}`;

  await insertRow<{ id: string }>("polls", {
    id,
    question: request.question,
    status: "active",
    is_onboarding: false,
  });

  const labels = readOptionLabels(request.options);
  if (labels.length > 0) {
    await insertRows("poll_options", labels.map((label, i) => ({
      id: `${id}-opt-${i + 1}`,
      poll_id: id,
      label,
      position: i,
    })));
  }
  return id;
}

export const pollRequestsRouter = Router();

pollRequestsRouter.get("/poll-requests", requireTier("moderator"), async (req, res) => {
  const parsed = requestsQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "invalid_query" });

  const params: Record<string, string | number> = {
    select: SELECT,
    order: "submitted_at.desc",
    limit: 100,
  };
  if (parsed.data.status !== "all") params.status = `eq.${parsed.data.status}`;

  const rows = await selectRows<PollRequestRow>("poll_requests", params);
  return res.status(200).json({
    requests: rows.map((row) => ({
      id: row.id,
      requesterId: row.requester_id,
      requesterName: row.requester_name,
      question: row.question,
      options: readOptionLabels(row.options),
      note: row.note,
      submittedAt: row.submitted_at,
      status: row.status,
      reviewedAt: row.reviewed_at,
      reviewedBy: row.reviewed_by,
    })),
  });
});

pollRequestsRouter.patch("/poll-requests/:id", requireTier("admin"), async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  const session = adminSession(res);

  // Fetch first so re-approving an already-approved request can't create a
  // duplicate poll (matches the community_requests flow).
  const existingRows = await selectRows<PollRequestRow>("poll_requests", {
    select: SELECT,
    id: `eq.${req.params.id}`,
    limit: 1,
  });
  const existing = existingRows[0];
  if (!existing) return res.status(404).json({ error: "request_not_found" });

  const rows = await updateRows<PollRequestRow>(
    "poll_requests",
    { id: `eq.${req.params.id}` },
    { status: parsed.data.status, reviewed_at: new Date().toISOString(), reviewed_by: session.username },
  );
  if (rows.length === 0) return res.status(404).json({ error: "request_not_found" });

  let createdPollId: string | null = null;
  if (parsed.data.status === "approved" && existing.status !== "approved") {
    createdPollId = await createPollFromRequest(existing);
  }

  await writeAudit(session, {
    action: "poll_request_reviewed",
    targetType: "poll_request",
    targetId: String(req.params.id),
    targetLabel: existing.question,
    details: { status: parsed.data.status, createdPollId },
  });
  return res.status(200).json({ ok: true, pollId: createdPollId });
});
