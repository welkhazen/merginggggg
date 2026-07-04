import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { captureServerEvent, getPostHogDistinctId } from "../lib/analytics";
import { sendCrashAlert } from "../lib/resend";
import { insertRow } from "../lib/supabaseAdmin";
import { getAdminSession } from "../middleware/adminAuth";

const reportSchema = z.object({
  source: z.enum(["client", "server", "supabase", "vercel", "external"]).default("client"),
  level: z.enum(["info", "warning", "error", "fatal"]).default("error"),
  message: z.string().trim().min(1).max(2000),
  stack: z.string().max(8000).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

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
    ...(parsed.data.context ?? {}),
    reportedBy: session?.username ?? "anonymous",
    userAgent: req.header("user-agent") ?? null,
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
