import { insertRow } from "./supabaseAdmin";
import type { AdminSession } from "./sessionToken";

export type AuditEntry = {
  action: string;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  details?: Record<string, unknown>;
};

// Fire-and-forget: an audit write failure must never fail the admin action itself.
export function writeAudit(session: AdminSession, entry: AuditEntry): void {
  void insertRow("admin_audit_log", {
    actor_id: session.userId,
    actor_username: session.username,
    actor_tier: session.tier,
    action: entry.action,
    target_type: entry.targetType ?? null,
    target_id: entry.targetId ?? null,
    target_label: entry.targetLabel ?? null,
    details: entry.details ?? {},
  }).catch((error) => {
    console.error("[audit] failed to write audit log entry", error);
  });
}
