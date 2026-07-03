import posthog from "posthog-js";

const token = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN as string | undefined;
const host = (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined) ?? "https://us.i.posthog.com";

export const isPostHogEnabled = Boolean(token);

if (isPostHogEnabled) {
  posthog.init(token, {
    api_host: host,
    defaults: "2026-01-30",
    capture_pageview: true,
    capture_pageleave: true,
  });
}

export { posthog };

export function captureAdminEvent(eventName: string, properties: Record<string, unknown> = {}) {
  if (!isPostHogEnabled) return;
  posthog.capture(eventName, {
    app: "standalone_admin_portal",
    ...properties,
  });
}

export function identifyAdmin(user: { id: string; username: string; role: string }) {
  if (!isPostHogEnabled) return;
  posthog.identify(user.id, {
    username: user.username,
    role: user.role,
    app: "standalone_admin_portal",
  });
}

export function captureAdminException(error: unknown, context: Record<string, unknown> = {}) {
  if (!isPostHogEnabled) return;
  if (error instanceof Error) {
    posthog.captureException(error, context);
    return;
  }
  posthog.capture("admin_portal_exception", {
    app: "standalone_admin_portal",
    error: String(error),
    ...context,
  });
}
