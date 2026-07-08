import { Router } from "express";
import { z } from "zod";
import { writeAudit } from "../../lib/audit.js";
import { selectRows, updateRows } from "../../lib/supabaseAdmin.js";
import { adminSession } from "../../middleware/adminAuth.js";

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

export const requestsRouter = Router();

requestsRouter.get("/community-requests", async (req, res) => {
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

requestsRouter.patch("/community-requests/:id", async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  const session = adminSession(res);
  const rows = await updateRows<CommunityRequestRow>(
    "community_requests",
    { id: `eq.${req.params.id}` },
    { status: parsed.data.status, reviewed_at: new Date().toISOString(), reviewed_by: session.username },
  );
  if (rows.length === 0) return res.status(404).json({ error: "request_not_found" });

  await writeAudit(session, {
    action: "community_request_reviewed",
    targetType: "community_request",
    targetId: req.params.id,
    targetLabel: rows[0].community_name,
    details: { status: parsed.data.status },
  });
  return res.status(200).json({ ok: true });
});
