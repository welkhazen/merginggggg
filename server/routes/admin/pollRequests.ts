import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { writeAudit } from "../../lib/audit.js";
import { insertRow, insertRows, selectRows, SupabaseAdminError, updateRows } from "../../lib/supabaseAdmin.js";
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

// poll_requests.id is a UUID. Validate it with a literal regexp guard before it
// flows into the PostgREST query URL: a regexp test is a form the static
// analyzer recognises as sanitising the value against request forgery (a zod
// schema check is not), and it rejects anything that could tamper with the URL.
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const SELECT =
  "id,requester_id,requester_name,question,options,note,submitted_at,status,reviewed_at,reviewed_by";

// These handlers touch the database; rate-limit them so a client can't hammer
// the review endpoints (mirrors the limiter on the auth routes).
const pollRequestsLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

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

// Insert the poll, retrying on a primary-key conflict with the next numbered
// slug. Retrying (rather than a pre-flight "which ids are taken" query) keeps id
// allocation safe against concurrent approvals -- the DB is the arbiter.
async function createPollFromRequest(request: PollRequestRow): Promise<string> {
  const base = slugify(request.question);
  const labels = readOptionLabels(request.options);

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const id = attempt === 0 ? base : `${base}-${attempt + 1}`;
    try {
      await insertRow<{ id: string }>("polls", {
        id,
        question: request.question,
        status: "active",
        is_onboarding: false,
      });
    } catch (error) {
      // 409 = id already taken; try the next numbered slug.
      if (error instanceof SupabaseAdminError && error.status === 409) continue;
      throw error;
    }

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

  throw new Error("could not allocate a unique poll id");
}

export const pollRequestsRouter = Router();

pollRequestsRouter.get("/poll-requests", requireTier("moderator"), pollRequestsLimiter, async (req, res) => {
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

pollRequestsRouter.patch("/poll-requests/:id", requireTier("admin"), pollRequestsLimiter, async (req, res) => {
  const requestId = String(req.params.id);
  if (!UUID_RE.test(requestId)) return res.status(400).json({ error: "invalid_id" });

  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  const session = adminSession(res);

  // Fetch first so re-approving an already-approved request can't create a
  // duplicate poll (matches the community_requests flow).
  const existingRows = await selectRows<PollRequestRow>("poll_requests", {
    select: SELECT,
    id: `eq.${requestId}`,
    limit: 1,
  });
  const existing = existingRows[0];
  if (!existing) return res.status(404).json({ error: "request_not_found" });

  // Create the poll BEFORE persisting the approved status. If creation fails the
  // request stays 'pending' and can be retried; the reverse would strand the
  // request as 'approved' with no backing poll and no way back to 'pending'.
  let createdPollId: string | null = null;
  if (parsed.data.status === "approved" && existing.status !== "approved") {
    createdPollId = await createPollFromRequest(existing);
  }

  const rows = await updateRows<PollRequestRow>(
    "poll_requests",
    { id: `eq.${requestId}` },
    { status: parsed.data.status, reviewed_at: new Date().toISOString(), reviewed_by: session.username },
  );
  if (rows.length === 0) return res.status(404).json({ error: "request_not_found" });

  // A failed audit write shouldn't mask an otherwise-successful review.
  try {
    await writeAudit(session, {
      action: "poll_request_reviewed",
      targetType: "poll_request",
      targetId: requestId,
      targetLabel: existing.question,
      details: { status: parsed.data.status, createdPollId },
    });
  } catch (error) {
    console.error("[pollRequests] failed to write audit entry", error);
  }
  return res.status(200).json({ ok: true, pollId: createdPollId });
});
