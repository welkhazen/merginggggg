import { Router } from "express";
import { z } from "zod";
import { writeAudit } from "../../lib/audit.js";
import { insertRow, selectRows, updateRows } from "../../lib/supabaseAdmin.js";
import { adminSession, requireTier } from "../../middleware/adminAuth.js";

type CommunityRequestRow = {
  id: string;
  requester_id: string | null;
  requester_name: string | null;
  community_name: string;
  genre: string | null;
  focus_area: string | null;
  audience: string | null;
  why_now: string | null;
  sample_prompt: string | null;
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

// A slug for the community id (matches the existing human-readable ids like
// "lnt", "the-ick"): lowercase, alphanumeric, hyphen-separated.
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// Short uppercase badge (e.g. "Late Night Talks" -> "LNT", "Suraket" -> "SUR").
function deriveAbbr(value: string): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words.map((w) => w[0]).join("") : (words[0] ?? "").slice(0, 3);
  return letters.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() || "NEW";
}

// Spawn the actual community room from an approved request. Returns the new id.
async function createCommunityFromRequest(request: CommunityRequestRow): Promise<string> {
  const base = slugify(request.community_name) || `community-${Date.now().toString(36)}`;
  // Pick a free slug: <base>, then <base>-2, <base>-3, ...
  const taken = new Set(
    (await selectRows<{ id: string }>("communities", { select: "id", id: `like.${base}*`, limit: 100 })).map((r) => r.id),
  );
  let id = base;
  for (let i = 2; taken.has(id); i += 1) id = `${base}-${i}`;

  // description and topic are NOT NULL on the communities table, so fall back to
  // other request fields (and finally the name) rather than inserting null.
  const description = request.focus_area || request.why_now || request.audience || request.community_name;
  const topic = request.sample_prompt || request.why_now || `Welcome to ${request.community_name}.`;

  const row = await insertRow<{ id: string }>("communities", {
    id,
    abbr: deriveAbbr(request.community_name),
    title: request.community_name,
    description,
    topic,
    status: "Active",
    locked: false,
    created_by: request.requester_id,
  });
  return row.id;
}

export const requestsRouter = Router();

requestsRouter.get("/community-requests", requireTier("moderator"), async (req, res) => {
  const parsed = requestsQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "invalid_query" });

  const params: Record<string, string | number> = {
    select:
      "id,requester_id,requester_name,community_name,genre,focus_area,audience,why_now,sample_prompt,submitted_at,status,reviewed_at,reviewed_by",
    order: "submitted_at.desc",
    limit: 100,
  };
  if (parsed.data.status !== "all") params.status = `eq.${parsed.data.status}`;

  const rows = await selectRows<CommunityRequestRow>("community_requests", params);
  return res.status(200).json({
    requests: rows.map((row) => ({
      id: row.id,
      requesterId: row.requester_id,
      requesterName: row.requester_name,
      communityName: row.community_name,
      genre: row.genre,
      focusArea: row.focus_area,
      audience: row.audience,
      whyNow: row.why_now,
      samplePrompt: row.sample_prompt,
      submittedAt: row.submitted_at,
      status: row.status,
      reviewedAt: row.reviewed_at,
      reviewedBy: row.reviewed_by,
    })),
  });
});

requestsRouter.patch("/community-requests/:id", requireTier("admin"), async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  const session = adminSession(res);

  // Fetch first: we need the request details to spawn the community, and its
  // current status so re-approving an already-approved request doesn't create a
  // duplicate community.
  const existingRows = await selectRows<CommunityRequestRow>("community_requests", {
    select:
      "id,requester_id,requester_name,community_name,genre,focus_area,audience,why_now,sample_prompt,submitted_at,status,reviewed_at,reviewed_by",
    id: `eq.${req.params.id}`,
    limit: 1,
  });
  const existing = existingRows[0];
  if (!existing) return res.status(404).json({ error: "request_not_found" });

  const rows = await updateRows<CommunityRequestRow>(
    "community_requests",
    { id: `eq.${req.params.id}` },
    { status: parsed.data.status, reviewed_at: new Date().toISOString(), reviewed_by: session.username },
  );
  if (rows.length === 0) return res.status(404).json({ error: "request_not_found" });

  // Approving a request spawns the actual community room (once).
  let createdCommunityId: string | null = null;
  if (parsed.data.status === "approved" && existing.status !== "approved") {
    createdCommunityId = await createCommunityFromRequest(existing);
  }

  await writeAudit(session, {
    action: "community_request_reviewed",
    targetType: "community_request",
    targetId: String(req.params.id),
    targetLabel: rows[0].community_name,
    details: { status: parsed.data.status, createdCommunityId },
  });
  return res.status(200).json({ ok: true, communityId: createdCommunityId });
});
