import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { captureServerEvent, getPostHogDistinctId } from "../lib/analytics.js";
import { sendCrashAlert } from "../lib/resend.js";
import { insertRow } from "../lib/supabaseAdmin.js";
import { getAdminSession } from "../middleware/adminAuth.js";

const reportSchema = z.object({
  source: z.enum(["client", "server", "supabase", "vercel", "external"]).default("client"),
  level: z.enum(["info", "warning", "error", "fatal"]).default("error"),
  message: z.string().trim().min(1).max(2000),
  stack: z.string().max(8000).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

// The endpoint is unauthenticated and the report is stored + emailed, so the
// caller-supplied context is reduced to a few short primitive values and
// anything that looks like a credential is dropped.
const SENSITIVE_KEY = /(pass|token|secret|key|auth|cookie|session|credential|email|phone)/i;
const MAX_CONTEXT_KEYS = 20;
const MAX_CONTEXT_VALUE_LENGTH = 300;

function sanitizeContext(context: Record<string, unknown> | undefined): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  if (!context) return clean;
  for (const [key, value] of Object.entries(context).slice(0, MAX_CONTEXT_KEYS)) {
    if (SENSITIVE_KEY.test(key)) continue;
    if (typeof value === "string") clean[key.slice(0, 60)] = value.slice(0, MAX_CONTEXT_VALUE_LENGTH);
    else if (typeof value === "number" || typeof value === "boolean" || value === null) clean[key.slice(0, 60)] = value;
  }
  return clean;
}

const reportLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many reports." },
});

export const errorsRouter = Router();

// Crash intake: stores the event and fans out an email alert. Unauthenticated
// (crashes can happen before login) but tightly rate limited and size capped.
errorsRouter.post("/report", reportLimiter, async (req, res) => {
  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  const session = getAdminSession(req);
  const context = {
    ...sanitizeContext(parsed.data.context),
    reportedBy: session?.username ?? "anonymous",
    userAgent: req.header("user-agent")?.slice(0, 200) ?? null,
  };

  await insertRow("error_events", {
    source: parsed.data.source,
    level: parsed.data.level,
    message: parsed.data.message,
    stack: parsed.data.stack ?? null,
    context,
  });

  void sendCrashAlert({
    source: parsed.data.source,
    level: parsed.data.level,
    message: parsed.data.message,
    stack: parsed.data.stack,
    context,
  });
  captureServerEvent(req, "error_event_reported_server", getPostHogDistinctId(req, session?.userId ?? "anonymous"), {
    source: parsed.data.source,
    level: parsed.data.level,
  });
  return res.status(200).json({ ok: true });
});
