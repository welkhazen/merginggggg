import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { captureAdminEvent, captureAdminException } from "@/lib/analytics";
import { fetchFlags, reviewFlag } from "@/lib/adminApi";
import { AdminButton, EmptyState, formatDate, Panel, Row, SelectField, Tag, useAsyncData } from "../ui";

export function FlagsTab() {
  const [reviewed, setReviewed] = useState<"false" | "true" | "all">("false");
  const { data: flags, loading, reload } = useAsyncData(() => fetchFlags(reviewed), [reviewed]);

  async function review(id: string, verdict: "violation" | "ok" | "unclear") {
    try {
      await reviewFlag(id, verdict);
      captureAdminEvent("admin_flag_reviewed", { verdict });
      toast({ title: "Flag reviewed", description: `Marked as ${verdict}.` });
      reload();
    } catch (error) {
      captureAdminException(error, { action: "admin_flag_review" });
      toast({ title: "Could not review flag" });
    }
  }

  return (
    <Panel
      title="Flagged content"
      hint="Messages auto-flagged by the word filter / AI moderation."
      actions={
        <div className="flex gap-2">
          <SelectField value={reviewed} onChange={(event) => setReviewed(event.target.value as typeof reviewed)}>
            <option value="false">Needs review</option>
            <option value="true">Reviewed</option>
            <option value="all">All</option>
          </SelectField>
          <AdminButton tone="outline" disabled={loading} onClick={reload} aria-label="Refresh flags">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </AdminButton>
        </div>
      }
    >
      {flags && flags.length === 0 && <EmptyState>No flags in this view.</EmptyState>}
      <div className="space-y-2">
        {flags?.map((flag) => (
          <Row key={flag.id}>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-xs text-raw-silver/55">
                <span className="font-semibold text-raw-text">{flag.senderName ?? flag.senderId ?? "unknown user"}</span>
                {flag.matchedWord && <Tag tone="red">{flag.matchedWord}</Tag>}
                {flag.verdict && <Tag tone="gold">{flag.verdict}</Tag>}
                {typeof flag.aiScore === "number" && <Tag tone="teal">AI {Math.round(flag.aiScore * 100)}%</Tag>}
                <span>{formatDate(flag.createdAt)}</span>
                {flag.communityId && <span>room {flag.communityId}</span>}
              </p>
              {flag.reason && <p className="mt-1 text-sm text-raw-text">{flag.reason}</p>}
              {flag.reviewedBy && (
                <p className="mt-1 text-xs text-raw-silver/40">
                  Reviewed by {flag.reviewedBy} {formatDate(flag.reviewedAt)}
                </p>
              )}
            </div>
            {!flag.reviewed && (
              <div className="flex gap-2">
                <AdminButton tone="danger" onClick={() => void review(flag.id, "violation")}>Violation</AdminButton>
                <AdminButton tone="teal" onClick={() => void review(flag.id, "ok")}>OK</AdminButton>
                <AdminButton tone="outline" onClick={() => void review(flag.id, "unclear")}>Unclear</AdminButton>
              </div>
            )}
          </Row>
        ))}
      </div>
    </Panel>
  );
}
