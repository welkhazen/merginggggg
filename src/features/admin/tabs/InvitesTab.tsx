import { useState } from "react";
import { RefreshCw, Sparkles, Ticket } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { captureAdminEvent, captureAdminException } from "@/lib/analytics";
import {
  fetchInviteRedemptions,
  fetchWaitlistRequests,
  grantInviteCodes,
  updateWaitlistRequest,
  type WaitlistRequestStatus,
} from "@/lib/adminApi";
import { AdminButton, EmptyState, Field, formatDate, Panel, Row, SelectField, statusTone, Tag, useAsyncData } from "../ui";

export function InvitesTab({ currentUsername }: { currentUsername: string }) {
  return (
    <>
      <WaitlistPanel />
      <GrantInvitesPanel currentUsername={currentUsername} />
      <RedemptionsPanel />
    </>
  );
}

const WAITLIST_STATUS_LABELS: Record<WaitlistRequestStatus, string> = {
  pending: "Pending",
  contacted: "Contacted",
  sent_code: "Code sent",
  closed: "Closed",
};

function WaitlistPanel() {
  const [status, setStatus] = useState<WaitlistRequestStatus | "all">("pending");
  const { data: requests, loading, reload } = useAsyncData(() => fetchWaitlistRequests(status), [status]);
  const [saving, setSaving] = useState(false);

  async function setRequestStatus(id: string, next: WaitlistRequestStatus) {
    setSaving(true);
    try {
      await updateWaitlistRequest(id, next);
      captureAdminEvent("admin_waitlist_request_updated", { status: next });
      toast({ title: `Request marked ${WAITLIST_STATUS_LABELS[next].toLowerCase()}` });
      reload();
    } catch (error) {
      captureAdminException(error, { action: "admin_waitlist_request_update" });
      toast({ title: "Could not update request" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel
      title="Signup waitlist"
      hint="Invite requests from the signup modal. Contact the person, grant a code below, then mark it sent."
      actions={
        <div className="flex gap-2">
          <SelectField value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option value="pending">Pending</option>
            <option value="contacted">Contacted</option>
            <option value="sent_code">Code sent</option>
            <option value="closed">Closed</option>
            <option value="all">All</option>
          </SelectField>
          <AdminButton tone="outline" disabled={loading} onClick={reload} aria-label="Refresh waitlist">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </AdminButton>
        </div>
      }
    >
      {requests && requests.length === 0 && <EmptyState>No waitlist requests in this view.</EmptyState>}
      <div className="space-y-2">
        {requests?.map((request) => (
          <Row key={request.id}>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-raw-text">
                <span className="break-all font-mono">{request.contact}</span>
                <Tag tone={statusTone(request.status)}>{WAITLIST_STATUS_LABELS[request.status]}</Tag>
              </p>
              <p className="mt-0.5 text-xs text-raw-silver/50">
                via {request.source.replace(/_/g, " ")} · {formatDate(request.submittedAt)}
              </p>
              {request.note && <p className="mt-1 text-xs text-raw-silver/60">Note: {request.note}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {request.status === "pending" && (
                <AdminButton tone="teal" disabled={saving} onClick={() => void setRequestStatus(request.id, "contacted")}>
                  Mark contacted
                </AdminButton>
              )}
              {(request.status === "pending" || request.status === "contacted") && (
                <AdminButton disabled={saving} onClick={() => void setRequestStatus(request.id, "sent_code")}>
                  <Ticket className="h-4 w-4" /> Code sent
                </AdminButton>
              )}
              {request.status !== "closed" && (
                <AdminButton tone="outline" disabled={saving} onClick={() => void setRequestStatus(request.id, "closed")}>
                  Close
                </AdminButton>
              )}
              {request.status === "closed" && (
                <AdminButton tone="outline" disabled={saving} onClick={() => void setRequestStatus(request.id, "pending")}>
                  Reopen
                </AdminButton>
              )}
            </div>
          </Row>
        ))}
      </div>
    </Panel>
  );
}

function GrantInvitesPanel({ currentUsername }: { currentUsername: string }) {
  const [selfCount, setSelfCount] = useState("10");
  const [username, setUsername] = useState("");
  const [count, setCount] = useState("3");
  const [loading, setLoading] = useState(false);

  async function grant(target: string, amount: number) {
    setLoading(true);
    try {
      const codes = await grantInviteCodes(target, amount);
      captureAdminEvent("admin_invite_codes_granted", { amount: codes.length, target_self: target === currentUsername });
      toast({ title: "Invite codes granted", description: `${codes.length} code(s) created for @${target}.` });
      if (target !== currentUsername) setUsername("");
    } catch (error) {
      captureAdminException(error, { action: "admin_invite_codes_grant", amount });
      toast({ title: "Could not grant codes", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel title="Grant invite codes" hint="Give a user extra founding invite codes beyond their base allotment.">
      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_90px_auto] sm:items-center">
          <div>
            <p className="text-sm font-medium text-raw-text">Generate for yourself</p>
            <p className="text-xs text-raw-silver/40">Create a batch of invite codes on @{currentUsername} to send out.</p>
          </div>
          <Field type="number" min={1} max={100} value={selfCount} onChange={(event) => setSelfCount(event.target.value)} />
          <AdminButton disabled={loading} onClick={() => void grant(currentUsername, Number.parseInt(selfCount, 10))}>
            <Sparkles className="h-4 w-4" /> Generate
          </AdminButton>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_90px_auto]">
          <Field value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" />
          <Field type="number" min={1} max={100} value={count} onChange={(event) => setCount(event.target.value)} />
          <AdminButton tone="outline" disabled={loading || !username.trim()} onClick={() => void grant(username.trim(), Number.parseInt(count, 10))}>
            <Ticket className="h-4 w-4" /> Grant to user
          </AdminButton>
        </div>
      </div>
    </Panel>
  );
}

function RedemptionsPanel() {
  const { data: redemptions, loading, reload } = useAsyncData(fetchInviteRedemptions);

  return (
    <Panel
      title="Recent redemptions"
      hint="Founding invite codes that have been used."
      actions={
        <AdminButton tone="outline" disabled={loading} onClick={reload} aria-label="Refresh redemptions">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </AdminButton>
      }
    >
      {redemptions && redemptions.length === 0 && <EmptyState>No redemptions yet.</EmptyState>}
      <div className="space-y-2">
        {redemptions?.map((redemption) => (
          <Row key={redemption.id}>
            <div>
              <p className="text-sm text-raw-text">
                <span className="font-mono">{redemption.code}</span>
                {redemption.redeemedUsername && <span> → @{redemption.redeemedUsername}</span>}
              </p>
              <p className="text-[10px] text-raw-silver/35">{formatDate(redemption.createdAt)}</p>
            </div>
          </Row>
        ))}
      </div>
    </Panel>
  );
}
