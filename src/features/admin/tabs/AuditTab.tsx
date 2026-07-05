import { useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { fetchAuditLog } from "@/lib/adminApi";
import { AdminButton, EmptyState, Field, formatDate, Panel, Row, Tag, useAsyncData } from "../ui";

export function AuditTab() {
  const [actor, setActor] = useState("");
  const [filter, setFilter] = useState({ actor: "" });
  const { data: entries, loading, reload } = useAsyncData(
    () => fetchAuditLog({ actor: filter.actor || undefined, limit: 100 }),
    [filter],
  );

  return (
    <Panel
      title="Audit log"
      hint="Every staff action taken through this portal, newest first."
      actions={
        <AdminButton tone="outline" disabled={loading} onClick={reload} aria-label="Refresh audit log">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </AdminButton>
      }
    >
      <form
        className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          setFilter({ actor: actor.trim() });
        }}
      >
        <Field value={actor} onChange={(event) => setActor(event.target.value)} placeholder="Filter by staff username" />
        <AdminButton type="submit">
          <Search className="h-4 w-4" /> Filter
        </AdminButton>
      </form>
      {entries && entries.length === 0 && <EmptyState>No audit entries yet.</EmptyState>}
      <div className="space-y-2">
        {entries?.map((entry) => (
          <Row key={entry.id}>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm text-raw-text">
                <span className="font-semibold">@{entry.actorUsername ?? entry.actorId}</span>
                {entry.actorTier && <Tag tone="gold">{entry.actorTier}</Tag>}
                <span className="font-mono text-xs text-raw-silver/70">{entry.action}</span>
                {entry.targetLabel && <span className="text-raw-silver/60">→ {entry.targetLabel}</span>}
              </p>
              {Object.keys(entry.details ?? {}).length > 0 && (
                <p className="mt-1 break-all font-mono text-[10px] text-raw-silver/40">{JSON.stringify(entry.details)}</p>
              )}
              <p className="mt-1 text-[10px] text-raw-silver/35">{formatDate(entry.createdAt)}</p>
            </div>
          </Row>
        ))}
      </div>
    </Panel>
  );
}
