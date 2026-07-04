import { env } from "../config/env";

export const isCrashAlertEnabled = Boolean(env.RESEND_API_KEY && env.CRASH_ALERT_FROM && env.CRASH_ALERT_TO);

export type CrashAlert = {
  source: string;
  level: string;
  message: string;
  stack?: string | null;
  context?: Record<string, unknown>;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendCrashAlert(alert: CrashAlert): Promise<void> {
  if (!isCrashAlertEnabled) return;

  const subject = `[${env.CRASH_ALERT_APP_NAME}] ${alert.level.toUpperCase()} (${alert.source}): ${alert.message.slice(0, 120)}`;
  const html = `
    <h2>${escapeHtml(env.CRASH_ALERT_APP_NAME)} crash alert</h2>
    <p><strong>Source:</strong> ${escapeHtml(alert.source)} &middot; <strong>Level:</strong> ${escapeHtml(alert.level)}</p>
    <p><strong>Message:</strong> ${escapeHtml(alert.message)}</p>
    ${alert.stack ? `<pre style="background:#111;color:#eee;padding:12px;border-radius:8px;overflow:auto">${escapeHtml(alert.stack)}</pre>` : ""}
    ${alert.context ? `<pre style="background:#f4f4f4;padding:12px;border-radius:8px;overflow:auto">${escapeHtml(JSON.stringify(alert.context, null, 2))}</pre>` : ""}
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.CRASH_ALERT_FROM,
        to: [env.CRASH_ALERT_TO],
        subject,
        html,
      }),
    });
    if (!response.ok) {
      console.error("[resend] crash alert failed", response.status, await response.text());
    }
  } catch (error) {
    console.error("[resend] crash alert failed", error);
  }
}
