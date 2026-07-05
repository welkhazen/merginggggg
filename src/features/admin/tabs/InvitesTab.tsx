import { useState } from "react";
import { RefreshCw, Sparkles, Ticket } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { captureAdminEvent, captureAdminException } from "@/lib/analytics";
import { fetchInviteRedemptions, grantInviteCodes } from "@/lib/adminApi";
import { AdminButton, EmptyState, Field, formatDate, Panel, Row, useAsyncData } from "../ui";

export function InvitesTab({ currentUsername }: { currentUsername: string }) {
  return (
    <>
      <GrantInvitesPanel currentUsername={currentUsername} />
      <RedemptionsPanel />
    </>
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
