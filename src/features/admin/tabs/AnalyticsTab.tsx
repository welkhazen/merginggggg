import { RefreshCw } from "lucide-react";
import { fetchAnalyticsSummary, type HogQLResult } from "@/lib/adminApi";
import { AdminButton, EmptyState, Panel } from "../ui";
import { useAsyncData } from "../useAsyncData";

export function AnalyticsTab() {
  const {
    data: summary,
    loading,
    reload,
  } = useAsyncData(fetchAnalyticsSummary);

  return (
    <Panel
      title="PostHog analytics"
      hint="Product analytics pulled live from PostHog."
      actions={
        <AdminButton
          tone="outline"
          disabled={loading}
          onClick={reload}
          aria-label="Refresh analytics"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </AdminButton>
      }
    >
      {summary && !summary.configured && (
        <EmptyState>
          PostHog Query API is not configured. Set POSTHOG_PERSONAL_API_KEY and
          POSTHOG_PROJECT_ID on the server to enable this tab.
        </EmptyState>
      )}
      {summary?.configured && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ResultTable
            title="Daily unique users (14d)"
            result={summary.dailyUsers}
          />
          <ResultTable title="Top events (7d)" result={summary.topEvents} />
          <ResultTable
            title="Admin portal activity (7d)"
            result={summary.adminActivity}
          />
        </div>
      )}
    </Panel>
  );
}

function ResultTable({
  title,
  result,
}: {
  title: string;
  result: HogQLResult;
}) {
  return (
    <div className="rounded-xl border border-raw-border/25 bg-raw-black/30 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-raw-silver/50">
        {title}
      </p>
      {!result.configured || "error" in result ? (
        <p className="text-xs text-raw-silver/45">
          {"error" in result && result.configured
            ? `Could not query PostHog (${result.error}).`
            : "Not configured."}
        </p>
      ) : result.results.length === 0 ? (
        <p className="text-xs text-raw-silver/45">No data.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr>
                {result.columns.map((column) => (
                  <th
                    key={column}
                    className="pb-1 pr-4 font-semibold text-raw-silver/60"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.results.slice(0, 15).map((row, index) => (
                <tr key={index} className="border-t border-raw-border/15">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="py-1 pr-4 text-raw-text">
                      {String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
