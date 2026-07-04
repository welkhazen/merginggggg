import { RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { captureAdminEvent, captureAdminException } from "@/lib/analytics";
import {
  deleteDonationInterest,
  fetchDonationInterests,
  fetchTokenRequests,
  updateDonationInterestStatus,
  updateTokenRequest,
} from "@/lib/adminApi";
import { AdminButton, EmptyState, formatDate, Panel, Row, statusTone, Tag, useAsyncData } from "../ui";

export function CommerceTab() {
  return (
    <>
      <DonationsPanel />
      <TokenRequestsPanel />
    </>
  );
}

function DonationsPanel() {
  const { data: requests, loading, reload, setData } = useAsyncData(fetchDonationInterests);
  const pendingCount = requests?.filter((request) => request.status === "pending").length ?? 0;

  async function markReviewed(id: string) {
    try {
      await updateDonationInterestStatus(id, "reviewed");
      captureAdminEvent("admin_donation_interest_reviewed");
      setData((current) => current?.map((request) => (request.id === id ? { ...request, status: "reviewed" as const } : request)) ?? null);
    } catch (error) {
      captureAdminException(error, { action: "admin_donation_review" });
      toast({ title: "Could not update submission" });
    }
  }

  async function remove(id: string) {
    try {
      await deleteDonationInterest(id);
      captureAdminEvent("admin_donation_interest_deleted");
      setData((current) => current?.filter((request) => request.id !== id) ?? null);
    } catch (error) {
      captureAdminException(error, { action: "admin_donation_delete" });
      toast({ title: "Could not delete submission" });
    }
  }

  return (
    <Panel
      title={`Donation interest ${pendingCount ? `(${pendingCount} pending)` : ""}`}
      hint="Review and clear donation interest submissions."
      actions={
        <AdminButton tone="outline" disabled={loading} onClick={reload} aria-label="Refresh donations">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </AdminButton>
      }
    >
      {requests && requests.length === 0 && <EmptyState>No submissions yet.</EmptyState>}
      <div className="space-y-2">
        {requests?.map((request) => (
          <Row key={request.id}>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-raw-text">{request.name}</p>
              <p className="truncate text-xs text-raw-silver/55">{request.email}</p>
              {request.phone && <p className="text-xs text-raw-silver/60">{request.phone}</p>}
              <p className="mt-1 text-[10px] text-raw-silver/35">
                {formatDate(request.submittedAt)} · <Tag tone={statusTone(request.status)}>{request.status}</Tag>
              </p>
            </div>
            <div className="flex gap-2">
              {request.status === "pending" && (
                <AdminButton tone="teal" onClick={() => void markReviewed(request.id)}>Mark reviewed</AdminButton>
              )}
              <AdminButton tone="outline" onClick={() => void remove(request.id)}>Delete</AdminButton>
            </div>
          </Row>
        ))}
      </div>
    </Panel>
  );
}

function TokenRequestsPanel() {
  const { data: requests, loading, reload } = useAsyncData(() => fetchTokenRequests("all"));

  async function review(id: string, status: "approved" | "rejected") {
    try {
      await updateTokenRequest(id, status);
      captureAdminEvent("admin_token_request_reviewed", { status });
      toast({ title: `Token request ${status}` });
      reload();
    } catch (error) {
      captureAdminException(error, { action: "admin_token_request_review" });
      toast({ title: "Could not update token request" });
    }
  }

  return (
    <Panel
      title="Token requests"
      hint="Members asking to buy or be granted tokens."
      actions={
        <AdminButton tone="outline" disabled={loading} onClick={reload} aria-label="Refresh token requests">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </AdminButton>
      }
    >
      {requests && requests.length === 0 && <EmptyState>No token requests yet.</EmptyState>}
      <div className="space-y-2">
        {requests?.map((request) => (
          <Row key={request.id}>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-raw-text">
                @{request.username ?? "unknown"}
                <Tag tone={statusTone(request.status)}>{request.status}</Tag>
                {typeof request.priceUsd === "number" && <Tag tone="gold">${request.priceUsd}</Tag>}
              </p>
              {request.reasons.length > 0 && <p className="mt-0.5 text-xs text-raw-silver/60">{request.reasons.join(", ")}</p>}
              {request.note && <p className="mt-0.5 text-xs text-raw-silver/60">{request.note}</p>}
              <p className="mt-1 text-[10px] text-raw-silver/35">{formatDate(request.createdAt)}</p>
            </div>
            {request.status === "pending" && (
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
