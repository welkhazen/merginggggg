import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { captureAdminEvent, captureAdminException } from "@/lib/analytics";
import {
  fetchErrorEvents,
  fetchSupabaseStatus,
  fetchSystemStatus,
  fetchVercelStatus,
  setErrorResolved,
} from "@/lib/adminApi";
import { AdminButton, EmptyState, Panel, Row, SelectField, Tag } from "../ui";
import { formatDate, statusTone } from "../utils";
import { useAsyncData } from "../useAsyncData";

export function SystemTab() {
  return (
    <>
      <IntegrationsPanel />
      <ErrorEventsPanel />
      <VercelPanel />
      <SupabasePanel />
    </>
  );
}

function IntegrationsPanel() {
  const { data: status, loading, reload } = useAsyncData(fetchSystemStatus);

  const items = status
    ? [
        { label: "Vercel API", enabled: status.integrations.vercel },
        {
          label: "Supabase Management API",
          enabled: status.integrations.supabaseMgmt,
        },
        {
          label: "Resend crash alerts",
          enabled: status.integrations.resendCrashAlerts,
        },
        {
          label: "PostHog Query API",
          enabled: status.integrations.posthogQuery,
        },
      ]
    : [];

  return (
    <Panel
      title="Integrations"
      hint={`Connected Supabase project: ${status?.supabaseProjectRef ?? "…"}`}
      actions={
        <AdminButton
          tone="outline"
          disabled={loading}
          onClick={reload}
          aria-label="Refresh status"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </AdminButton>
      }
    >
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Tag key={item.label} tone={item.enabled ? "green" : "gray"}>
            {item.label}: {item.enabled ? "on" : "not configured"}
          </Tag>
        ))}
      </div>
    </Panel>
  );
}

function ErrorEventsPanel() {
  const [resolved, setResolved] = useState<"false" | "true" | "all">("false");
  const {
    data: errors,
    loading,
    reload,
  } = useAsyncData(() => fetchErrorEvents(resolved), [resolved]);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function toggleResolved(id: string, value: boolean) {
    try {
      await setErrorResolved(id, value);
      captureAdminEvent("admin_error_event_resolved", { resolved: value });
      reload();
    } catch (error) {
      captureAdminException(error, { action: "admin_error_resolve" });
      toast({ title: "Could not update error" });
    }
  }

  return (
    <Panel
      title="Error events"
      hint="Crashes and errors reported by the apps (client + server)."
      actions={
        <div className="flex gap-2">
          <SelectField
            value={resolved}
            onChange={(event) =>
              setResolved(event.target.value as typeof resolved)
            }
          >
            <option value="false">Open</option>
            <option value="true">Resolved</option>
            <option value="all">All</option>
          </SelectField>
          <AdminButton
            tone="outline"
            disabled={loading}
            onClick={reload}
            aria-label="Refresh errors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </AdminButton>
        </div>
      }
    >
      {errors && errors.length === 0 && (
        <EmptyState>No error events. All clear.</EmptyState>
      )}
      <div className="space-y-2">
        {errors?.map((event) => (
          <Row key={event.id}>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-xs text-raw-silver/55">
                <Tag tone={statusTone(event.level)}>{event.level}</Tag>
                <Tag tone="teal">{event.source}</Tag>
                <span>{formatDate(event.createdAt)}</span>
                {event.resolved && event.resolvedBy && (
                  <span>resolved by {event.resolvedBy}</span>
                )}
              </p>
              <p className="mt-1 break-all text-sm text-raw-text">
                {event.message}
              </p>
              {expanded === event.id && event.stack && (
                <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-raw-border/25 bg-raw-black/50 p-2 text-[10px] text-raw-silver/60">
                  {event.stack}
                </pre>
              )}
            </div>
            <div className="flex gap-2">
              {event.stack && (
                <AdminButton
                  tone="outline"
                  onClick={() =>
                    setExpanded(expanded === event.id ? null : event.id)
                  }
                >
                  {expanded === event.id ? "Hide stack" : "Stack"}
                </AdminButton>
              )}
              {event.resolved ? (
                <AdminButton
                  tone="outline"
                  onClick={() => void toggleResolved(event.id, false)}
                >
                  Reopen
                </AdminButton>
              ) : (
                <AdminButton
                  tone="teal"
                  onClick={() => void toggleResolved(event.id, true)}
                >
                  Resolve
                </AdminButton>
              )}
            </div>
          </Row>
        ))}
      </div>
    </Panel>
  );
}

function VercelPanel() {
  const { data: status, loading, reload } = useAsyncData(fetchVercelStatus);

  return (
    <Panel
      title="Vercel deployments"
      hint="Latest deployments from the Vercel API."
      actions={
        <AdminButton
          tone="outline"
          disabled={loading}
          onClick={reload}
          aria-label="Refresh deployments"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </AdminButton>
      }
    >
      {status && !status.configured && (
        <EmptyState>
          Vercel API is not configured. Set VERCEL_TOKEN (and optionally
          VERCEL_TEAM_ID / VERCEL_PROJECT_ID).
        </EmptyState>
      )}
      {status?.configured && "error" in status && (
        <EmptyState>Could not reach Vercel ({status.error}).</EmptyState>
      )}
      {status?.configured && "deployments" in status && (
        <div className="space-y-2">
          {status.deployments.length === 0 && (
            <EmptyState>No deployments found.</EmptyState>
          )}
          {status.deployments.map((deployment) => (
            <Row key={deployment.uid}>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm text-raw-text">
                  <span className="font-semibold">{deployment.name}</span>
                  <Tag
                    tone={
                      deployment.state === "READY"
                        ? "green"
                        : deployment.state === "ERROR"
                          ? "red"
                          : "gold"
                    }
                  >
                    {deployment.state}
                  </Tag>
                  {deployment.target && (
                    <Tag tone="teal">{deployment.target}</Tag>
                  )}
                </p>
                {deployment.url && (
                  <p className="mt-0.5 truncate text-xs text-raw-silver/50">
                    {deployment.url}
                  </p>
                )}
                {deployment.errorMessage && (
                  <p className="mt-0.5 text-xs text-red-300">
                    {deployment.errorMessage}
                  </p>
                )}
                <p className="mt-1 text-[10px] text-raw-silver/35">
                  {formatDate(deployment.createdAt)}
                </p>
              </div>
            </Row>
          ))}
        </div>
      )}
    </Panel>
  );
}

function SupabasePanel() {
  const { data: status, loading, reload } = useAsyncData(fetchSupabaseStatus);

  return (
    <Panel
      title="Supabase health"
      hint="Advisors and recent database errors from the Supabase Management API."
      actions={
        <AdminButton
          tone="outline"
          disabled={loading}
          onClick={reload}
          aria-label="Refresh Supabase status"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </AdminButton>
      }
    >
      {status?.advisors && !status.advisors.configured ? (
        <EmptyState>
          Supabase Management API is not configured. Set SUPABASE_MGMT_TOKEN to
          enable advisors and logs.
        </EmptyState>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-raw-silver/50">
              Advisors
            </p>
            {status?.advisors.configured && "error" in status.advisors && (
              <p className="text-xs text-raw-silver/45">
                Could not load advisors ({status.advisors.error}).
              </p>
            )}
            {status?.advisors.configured && "advisors" in status.advisors && (
              <div className="space-y-1">
                {status.advisors.advisors.length === 0 && (
                  <p className="text-xs text-raw-silver/45">
                    No advisories. Clean bill of health.
                  </p>
                )}
                {status.advisors.advisors.map((advisor, index) => (
                  <p key={index} className="text-xs text-raw-silver/60">
                    <Tag tone={advisor.level === "ERROR" ? "red" : "gold"}>
                      {advisor.level}
                    </Tag>{" "}
                    <span className="font-semibold text-raw-text">
                      {advisor.title}
                    </span>{" "}
                    {advisor.description}
                  </p>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-raw-silver/50">
              Recent database errors
            </p>
            {status?.logs.configured && "error" in status.logs && (
              <p className="text-xs text-raw-silver/45">
                Could not load logs ({status.logs.error}).
              </p>
            )}
            {status?.logs.configured && "logs" in status.logs && (
              <div className="space-y-1">
                {status.logs.logs.length === 0 && (
                  <p className="text-xs text-raw-silver/45">
                    No recent database errors.
                  </p>
                )}
                {status.logs.logs.slice(0, 20).map((log, index) => (
                  <p
                    key={index}
                    className="break-all font-mono text-[10px] text-raw-silver/55"
                  >
                    {JSON.stringify(log)}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}
