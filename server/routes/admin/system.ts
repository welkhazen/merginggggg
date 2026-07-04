import { Router } from "express";
import { z } from "zod";
import { writeAudit } from "../../lib/audit";
import { isPostHogQueryConfigured } from "../../lib/posthogQuery";
import { isCrashAlertEnabled } from "../../lib/resend";
import {
  fetchSupabaseAdvisors,
  fetchSupabaseLogs,
  fetchVercelDeployments,
  isSupabaseMgmtConfigured,
  isVercelConfigured,
  supabaseProjectRef,
} from "../../lib/systemIntegrations";
import { selectRows, updateRows } from "../../lib/supabaseAdmin";
import { adminSession } from "../../middleware/adminAuth";

type ErrorEventRow = {
  id: string;
  source: string;
  level: string;
  message: string;
  stack: string | null;
  context: Record<string, unknown>;
  created_at: string;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
};

const errorsQuerySchema = z.object({
  resolved: z.enum(["true", "false", "all"]).default("false"),
  source: z.enum(["client", "server", "supabase", "vercel", "external", "all"]).default("all"),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

const resolveSchema = z.object({
  resolved: z.boolean(),
});

export const systemRouter = Router();

systemRouter.get("/system/status", (_req, res) => {
  return res.status(200).json({
    integrations: {
      vercel: isVercelConfigured,
      supabaseMgmt: isSupabaseMgmtConfigured,
      resendCrashAlerts: isCrashAlertEnabled,
      posthogQuery: isPostHogQueryConfigured,
    },
    supabaseProjectRef,
  });
});

systemRouter.get("/system/errors", async (req, res) => {
  const parsed = errorsQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "invalid_query" });

  const params: Record<string, string | number> = {
    select: "id,source,level,message,stack,context,created_at,resolved,resolved_by,resolved_at",
    order: "created_at.desc",
    limit: parsed.data.limit,
  };
  if (parsed.data.resolved !== "all") params.resolved = `eq.${parsed.data.resolved}`;
  if (parsed.data.source !== "all") params.source = `eq.${parsed.data.source}`;

  const rows = await selectRows<ErrorEventRow>("error_events", params);
  return res.status(200).json({
    errors: rows.map((row) => ({
      id: row.id,
      source: row.source,
      level: row.level,
      message: row.message,
      stack: row.stack,
      context: row.context,
      createdAt: row.created_at,
      resolved: row.resolved,
      resolvedBy: row.resolved_by,
      resolvedAt: row.resolved_at,
    })),
  });
});

systemRouter.patch("/system/errors/:id", async (req, res) => {
  const parsed = resolveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  const session = adminSession(res);
  const rows = await updateRows<ErrorEventRow>(
    "error_events",
    { id: `eq.${req.params.id}` },
    parsed.data.resolved
      ? { resolved: true, resolved_by: session.username, resolved_at: new Date().toISOString() }
      : { resolved: false, resolved_by: null, resolved_at: null },
  );
  if (rows.length === 0) return res.status(404).json({ error: "error_event_not_found" });

  writeAudit(session, {
    action: parsed.data.resolved ? "error_event_resolved" : "error_event_reopened",
    targetType: "error_event",
    targetId: req.params.id,
  });
  return res.status(200).json({ ok: true });
});

systemRouter.get("/system/vercel", async (_req, res) => {
  return res.status(200).json(await fetchVercelDeployments());
});

systemRouter.get("/system/supabase", async (_req, res) => {
  const [advisors, logs] = await Promise.all([fetchSupabaseAdvisors(), fetchSupabaseLogs()]);
  return res.status(200).json({ advisors, logs });
});
