type AuditLevel = "info" | "warn";

export function audit(event: string, payload: Record<string, unknown>, level: AuditLevel = "info") {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    event,
    ...payload,
  });

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
}
