import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { captureAdminEvent, captureAdminException } from "@/lib/analytics";
import {
  deleteDonationInterest,
  fetchDonationInterests,
  fetchTokenRequests,
  updateDonationInterestStatus,
  updateTokenRequest,
  type TokenRequest,
} from "@/lib/adminApi";
import { AdminButton, EmptyState, Panel, Row, Tag } from "../ui";
import { formatDate, statusTone } from "../utils";
import { useAsyncData } from "../useAsyncData";

export function CommerceTab() {
  return (
    <>
      <DonationsPanel />
      <TokenRequestsPanel />
    </>
  );
}

function DonationsPanel() {
  const {
    data: requests,
    loading,
    reload,
    setData,
  } = useAsyncData(fetchDonationInterests);
  const pendingCount =
    requests?.filter((request) => request.status === "pending").length ?? 0;

  async function markReviewed(id: string) {
    try {
      await updateDonationInterestStatus(id, "reviewed");
      captureAdminEvent("admin_donation_interest_reviewed");
      setData(
        (current) =>
          current?.map((request) =>
            request.id === id
              ? { ...request, status: "reviewed" as const }
              : request,
          ) ?? null,
      );
    } catch (error) {
      captureAdminException(error, { action: "admin_donation_review" });
      toast({ title: "Could not update submission" });
    }
  }

  async function remove(id: string) {
    try {
      await deleteDonationInterest(id);
      captureAdminEvent("admin_donation_interest_deleted");
      setData(
        (current) => current?.filter((request) => request.id !== id) ?? null,
      );
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
        <AdminButton
          tone="outline"
          disabled={loading}
          onClick={reload}
          aria-label="Refresh donations"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </AdminButton>
      }
    >
      {requests && requests.length === 0 && (
        <EmptyState>No submissions yet.</EmptyState>
      )}
      <div className="space-y-2">
        {requests?.map((request) => (
          <Row key={request.id}>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-raw-text">
                {request.name}
              </p>
              <p className="truncate text-xs text-raw-silver/55">
                {request.email}
              </p>
              {request.phone && (
                <p className="text-xs text-raw-silver/60">{request.phone}</p>
              )}
              <p className="mt-1 text-[10px] text-raw-silver/35">
                {formatDate(request.submittedAt)} ·{" "}
                <Tag tone={statusTone(request.status)}>{request.status}</Tag>
              </p>
            </div>
            <div className="flex gap-2">
              {request.status === "pending" && (
                <AdminButton
                  tone="teal"
                  onClick={() => void markReviewed(request.id)}
                >
                  Mark reviewed
                </AdminButton>
              )}
              <AdminButton
                tone="outline"
                onClick={() => void remove(request.id)}
              >
                Delete
              </AdminButton>
            </div>
          </Row>
        ))}
      </div>
    </Panel>
  );
}

function TokenRequestsPanel() {
  const {
    data: requests,
    loading,
    reload,
  } = useAsyncData(() => fetchTokenRequests("all"));

  async function review(
    id: string,
    status: "approved" | "rejected",
    tokenAmount?: number,
  ) {
    try {
      await updateTokenRequest(id, status, tokenAmount);
      captureAdminEvent("admin_token_request_reviewed", {
        status,
        tokenAmount,
      });
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
        <AdminButton
          tone="outline"
          disabled={loading}
          onClick={reload}
          aria-label="Refresh token requests"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </AdminButton>
      }
    >
      {requests && requests.length === 0 && (
        <EmptyState>No token requests yet.</EmptyState>
      )}
      <div className="space-y-2">
        {requests?.map((request) => (
          <TokenRequestRow
            key={request.id}
            request={request}
            onReview={review}
          />
        ))}
      </div>
    </Panel>
  );
}

function requestedTokenAmount(request: TokenRequest): number {
  if (typeof request.tokens === "number" && request.tokens > 0)
    return request.tokens;
  const text = [...request.reasons, request.note ?? ""].join(" ");
  const match = text.match(/\b(\d+)\s+tokens?\b/i);
  return match ? Number(match[1]) : 1;
}

function TokenRequestRow({
  request,
  onReview,
}: {
  request: TokenRequest;
  onReview: (
    id: string,
    status: "approved" | "rejected",
    tokenAmount?: number,
  ) => Promise<void>;
}) {
  const [tokenAmount, setTokenAmount] = useState(() =>
    requestedTokenAmount(request),
  );
  const validAmount = Number.isInteger(tokenAmount) && tokenAmount > 0;
  const canReview = request.status === "pending" || request.status === "new";

  return (
    <Row>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-raw-text">
          @{request.username ?? "unknown"}
          <Tag tone={statusTone(request.status)}>{request.status}</Tag>
          {typeof request.priceUsd === "number" && (
            <Tag tone="gold">${request.priceUsd}</Tag>
          )}
        </p>
        {typeof request.tokens === "number" && (
          <p className="mt-0.5 text-xs text-raw-silver/60">
            {request.tokens} tokens
          </p>
        )}
        {request.reasons.length > 0 && (
          <p className="mt-0.5 text-xs text-raw-silver/60">
            {request.reasons.join(", ")}
          </p>
        )}
        {request.note && (
          <p className="mt-0.5 text-xs text-raw-silver/60">{request.note}</p>
        )}
        <p className="mt-1 text-[10px] text-raw-silver/35">
          {formatDate(request.createdAt)}
        </p>
      </div>
      {canReview && (
        <div className="flex gap-2">
          <input
            aria-label={`Token amount for ${request.username ?? "request"}`}
            className="h-10 w-28 rounded-md border border-raw-line bg-raw-black px-3 text-sm font-semibold text-raw-text outline-none focus:border-raw-cyan"
            min={1}
            step={1}
            type="number"
            value={tokenAmount}
            onChange={(event) => setTokenAmount(Number(event.target.value))}
          />
          <AdminButton
            tone="teal"
            disabled={!validAmount}
            onClick={() => void onReview(request.id, "approved", tokenAmount)}
          >
            Approve
          </AdminButton>
          <AdminButton
            tone="danger"
            onClick={() => void onReview(request.id, "rejected")}
          >
            Reject
          </AdminButton>
        </div>
      )}
    </Row>
  );
}
