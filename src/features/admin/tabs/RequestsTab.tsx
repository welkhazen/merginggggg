import { type StaffTier, tierAtLeast } from "@/lib/adminApi";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { captureAdminEvent, captureAdminException } from "@/lib/analytics";
import { fetchCommunityRequests, reviewCommunityRequest } from "@/lib/adminApi";
import { AdminButton, EmptyState, formatDate, Panel, Row, SelectField, statusTone, Tag, useAsyncData } from "../ui";

export function RequestsTab({ currentTier }: { currentTier: StaffTier }) {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const { data: requests, loading, reload } = useAsyncData(() => fetchCommunityRequests(status), [status]);
  const canReview = tierAtLeast(currentTier, "admin");

  async function review(id: string, outcome: "approved" | "rejected") {
    try {
      await reviewCommunityRequest(id, outcome);
      captureAdminEvent("admin_community_request_reviewed", { status: outcome });
      toast({ title: `Request ${outcome}` });
      reload();
    } catch (error) {
      captureAdminException(error, { action: "admin_community_request_review" });
      toast({ title: "Could not update request" });
    }
  }

  return (
    <Panel
      title="Community requests"
      hint="Member proposals for new community rooms."
      actions={
        <div className="flex gap-2">
          <SelectField value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </SelectField>
          <AdminButton tone="outline" disabled={loading} onClick={reload} aria-label="Refresh requests">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </AdminButton>
        </div>
      }
    >
      {requests && requests.length === 0 && <EmptyState>No requests in this view.</EmptyState>}
      <div className="space-y-2">
        {requests?.map((request) => (
          <Row key={request.id}>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-raw-text">
                {request.communityName}
                <Tag tone={statusTone(request.status)}>{request.status}</Tag>
                {request.genre && <Tag tone="teal">{request.genre}</Tag>}
              </p>
              <p className="mt-0.5 text-xs text-raw-silver/50">
                by @{request.requesterName ?? "unknown"} · {formatDate(request.submittedAt)}
              </p>
              {request.focusArea && <p className="mt-1 text-xs text-raw-silver/60">Focus: {request.focusArea}</p>}
              {request.audience && <p className="text-xs text-raw-silver/60">Audience: {request.audience}</p>}
              {request.whyNow && <p className="text-xs text-raw-silver/60">Why now: {request.whyNow}</p>}
              {request.samplePrompt && <p className="text-xs text-raw-silver/60">Sample: {request.samplePrompt}</p>}
              {request.reviewedBy && (
                <p className="mt-1 text-xs text-raw-silver/40">Reviewed by {request.reviewedBy} {formatDate(request.reviewedAt)}</p>
              )}
            </div>
            {canReview && request.status === "pending" && (
              <div className="flex gap-2">
                <AdminButton tone="teal" onClick={() => void review(request.id, "approved")}>Approve</AdminButton>
                <AdminButton tone="danger" onClick={() => void review(request.id, "rejected")}>Reject</AdminButton>
              </div>
            )}
          </Row>
        ))}
      </div>
    </Panel>
  );
}
