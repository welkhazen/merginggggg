import { reportClientError } from "@/lib/adminApi";

// Global crash reporting: uncaught errors and unhandled rejections are sent
// to /api/errors/report (stored in error_events + emailed via Resend when
// configured). Deduped per message so a render loop can't flood the API.
const reported = new Set<string>();
const MAX_REPORTS_PER_SESSION = 10;

function report(message: string, stack?: string, context?: Record<string, unknown>) {
  if (reported.size >= MAX_REPORTS_PER_SESSION || reported.has(message)) return;
  reported.add(message);
  void reportClientError(message, stack, { ...context, url: window.location.href });
}

export function installGlobalErrorReporting(): void {
  window.addEventListener("error", (event) => {
    report(event.message || "Unknown error", event.error instanceof Error ? event.error.stack : undefined, {
      filename: event.filename,
      line: event.lineno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    if (reason instanceof Error) {
      report(reason.message, reason.stack, { kind: "unhandledrejection" });
    } else {
      report(String(reason ?? "Unhandled rejection"), undefined, { kind: "unhandledrejection" });
    }
  });
}
