import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { captureAdminEvent, captureAdminException } from "@/lib/analytics";
import { fetchReports, resolveReport } from "@/lib/adminApi";
import { AdminButton, EmptyState, Panel, Row, SelectField, Tag } from "../ui";
import { formatDate, statusTone } from "../utils";
import { useAsyncData } from "../useAsyncData";

export function ReportsTab() {
  const [status, setStatus] = useState<"open" | "closed" | "all">("open");
  const {
    data: reports,
    loading,
    reload,
  } = useAsyncData(() => fetchReports(status), [status]);

  async function review(id: string, outcome: "resolved" | "dismissed") {
    try {
      await resolveReport(id, outcome);
      captureAdminEvent("admin_report_resolved", { status: outcome });
      toast({
        title: outcome === "resolved" ? "Report resolved" : "Report dismissed",
      });
      reload();
    } catch (error) {
      captureAdminException(error, { action: "admin_report_resolve" });
      toast({ title: "Could not update report" });
    }
  }

  return (
    <Panel
      title="Chat reports"
      hint="Reports submitted by members from community rooms."
      actions={
        <div className="flex gap-2">
          <SelectField
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="all">All</option>
          </SelectField>
          <AdminButton
            tone="outline"
            disabled={loading}
            onClick={reload}
            aria-label="Refresh reports"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </AdminButton>
        </div>
      }
    >
      {reports && reports.length === 0 && (
        <EmptyState>No reports here. Nice and quiet.</EmptyState>
      )}
      <div className="space-y-2">
        {reports?.map((report) => (
          <Row key={report.id}>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-xs text-raw-silver/55">
                <Tag tone={statusTone(report.status)}>{report.status}</Tag>
                <span>{formatDate(report.createdAt)}</span>
                {report.communityTitle && (
                  <span>in {report.communityTitle}</span>
                )}
              </p>
              <p className="mt-1 text-sm text-raw-text">
                <span className="font-semibold">
                  @{report.reporterName ?? "unknown"}
                </span>{" "}
                reported{" "}
                <span className="font-semibold">
                  @{report.reportedUsername ?? "unknown"}
                </span>
                {report.reason && (
                  <span className="text-raw-silver/60"> — {report.reason}</span>
                )}
              </p>
              {report.messageText && (
                <p className="mt-1 rounded-lg border border-raw-border/25 bg-raw-black/40 px-2 py-1 text-xs text-raw-silver/60">
                  “{report.messageText}”
                </p>
              )}
              {report.details && (
                <p className="mt-1 text-xs text-raw-silver/45">
                  {report.details}
                </p>
              )}
              {report.resolvedBy && (
                <p className="mt-1 text-xs text-raw-silver/40">
                  Closed by {report.resolvedBy} {formatDate(report.resolvedAt)}
                </p>
              )}
            </div>
            {report.status === "open" && (
              <div className="flex gap-2">
                <AdminButton
                  tone="teal"
                  onClick={() => void review(report.id, "resolved")}
                >
                  Resolve
                </AdminButton>
                <AdminButton
                  tone="outline"
                  onClick={() => void review(report.id, "dismissed")}
                >
                  Dismiss
                </AdminButton>
              </div>
            )}
          </Row>
        ))}
      </div>
    </Panel>
  );
}
