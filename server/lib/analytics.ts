import type { Request } from "express";
import { PostHog } from "posthog-node";
import { env } from "../config/env.js";

const posthog = env.POSTHOG_PROJECT_API_KEY
  ? new PostHog(env.POSTHOG_PROJECT_API_KEY, {
      host: env.POSTHOG_HOST ?? "https://us.i.posthog.com",
    })
  : null;

export function getPostHogDistinctId(req: Request, fallback: string) {
  const header = req.header("x-posthog-distinct-id");
  return header && header.trim() ? header : fallback;
}

export function captureServerEvent(
  req: Request,
  event: string,
  distinctId: string,
  properties: Record<string, unknown> = {},
) {
  if (!posthog) return;
  posthog.capture({
    distinctId,
    event,
    properties: {
      app: "standalone_admin_portal",
      session_id: req.header("x-posthog-session-id") ?? undefined,
      ...properties,
    },
  });
}

export async function shutdownAnalytics() {
  await posthog?.shutdown();
}
