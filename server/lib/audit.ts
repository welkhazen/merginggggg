import { insertRow } from "./supabaseAdmin";
import type { AdminSession } from "./sessionToken";

export type AuditEntry = {
  action: string;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  details?: Record<string, unknown>;
};

// Awaited by handlers so serverless invocations can't drop the write, but an
// audit failure must never fail the admin action itself.
export async function writeAudit(session: AdminSession, entry: AuditEntry): Promise<void> {
  try {
    await insertRow("admin_audit_log", {
      actor_id: session.userId,
      actor_username: session.username,
      actor_tier: session.tier,
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      target_label: entry.targetLabel ?? null,
      details: entry.details ?? {},
    });
  } catch (error) {
    console.error("[audit] failed to write audit log entry", error);
  }
}
