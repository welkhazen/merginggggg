import { Router } from "express";
import { z } from "zod";
import { captureServerEvent, getPostHogDistinctId } from "../../lib/analytics";
import { writeAudit } from "../../lib/audit";
import { selectRows, updateRows } from "../../lib/supabaseAdmin";
import { adminSession } from "../../middleware/adminAuth";

type ChatReportRow = {
  id: string;
  community_id: string | null;
  community_title: string | null;
  message_id: string | null;
  message_text: string | null;
  reporter_id: string | null;
  reporter_name: string | null;
  reported_user_id: string | null;
  reported_username: string | null;
  reason: string | null;
  details: string | null;
  status: string;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
};

const reportsQuerySchema = z.object({
  status: z.enum(["open", "closed", "all"]).default("open"),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

const resolveSchema = z.object({
  status: z.enum(["resolved", "dismissed"]),
});

function mapReport(row: ChatReportRow) {
  return {
    id: row.id,
    communityId: row.community_id,
    communityTitle: row.community_title,
    messageId: row.message_id,
    messageText: row.message_text,
    reporterId: row.reporter_id,
    reporterName: row.reporter_name,
    reportedUserId: row.reported_user_id,
    reportedUsername: row.reported_username,
    reason: row.reason,
    details: row.details,
    status: row.status,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
    createdAt: row.created_at,
  };
}

export const reportsRouter = Router();

reportsRouter.get("/reports", async (req, res) => {
  const parsed = reportsQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "invalid_query" });

  const params: Record<string, string | number> = {
    select:
      "id,community_id,community_title,message_id,message_text,reporter_id,reporter_name,reported_user_id,reported_username,reason,details,status,resolved_at,resolved_by,created_at",
    order: "created_at.desc",
    limit: parsed.data.limit,
  };
  if (parsed.data.status === "open") params.status = "eq.open";
  if (parsed.data.status === "closed") params.status = "neq.open";

  const rows = await selectRows<ChatReportRow>("chat_reports", params);
  return res.status(200).json({ reports: rows.map(mapReport) });
});

reportsRouter.patch("/reports/:id", async (req, res) => {
  const parsed = resolveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  const session = adminSession(res);
  const rows = await updateRows<ChatReportRow>(
    "chat_reports",
    { id: `eq.${req.params.id}` },
    {
      status: parsed.data.status,
      resolved_at: new Date().toISOString(),
      resolved_by: session.username,
    },
  );
  if (rows.length === 0) return res.status(404).json({ error: "report_not_found" });

  writeAudit(session, {
    action: "report_resolved",
    targetType: "chat_report",
    targetId: req.params.id,
    targetLabel: rows[0].reported_username ?? undefined,
    details: { status: parsed.data.status },
  });
  captureServerEvent(req, "admin_report_resolved_server", getPostHogDistinctId(req, session.userId), {
    status: parsed.data.status,
  });
  return res.status(200).json({ ok: true });
});
