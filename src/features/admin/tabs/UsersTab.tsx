import { useState } from "react";
import {
  Ban,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { captureAdminEvent, captureAdminException } from "@/lib/analytics";
import {
  fetchAppeals,
  fetchUserDetail,
  fetchUsers,
  deleteUser,
  moderateUser,
  reviewAppeal,
  TIER_LABELS,
  type ManagedUser,
  type ModerationAction,
  type UserDetail,
} from "@/lib/adminApi";
import {
  AdminButton,
  EmptyState,
  Field,
  Panel,
  Row,
  SelectField,
  Tag,
} from "../ui";
import { formatDate, statusTone } from "../utils";
import { useAsyncData } from "../useAsyncData";

export function UsersTab() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "warned" | "banned">(
    "all",
  );
  const [search, setSearch] = useState({ q: "", status: "all" });
  const {
    data: users,
    loading,
    reload,
  } = useAsyncData(
    () =>
      fetchUsers({
        q: search.q || undefined,
        status: search.status,
        limit: 50,
      }),
    [search],
  );
  const [detail, setDetail] = useState<UserDetail | null>(null);

  async function openDetail(user: ManagedUser) {
    try {
      setDetail(await fetchUserDetail(user.id));
    } catch (error) {
      captureAdminException(error, { action: "admin_user_detail" });
      toast({ title: "Could not load user" });
    }
  }

  function removeUser(user: ManagedUser) {
    toast({
      title: `Delete @${user.username}?`,
      description: "This permanently removes the account and cannot be undone.",
      action: (
        <ToastAction
          altText={`Delete @${user.username}`}
          onClick={() => void confirmRemoveUser(user)}
        >
          Delete
        </ToastAction>
      ),
    });
  }

  async function confirmRemoveUser(user: ManagedUser) {
    try {
      await deleteUser(user.id);
      captureAdminEvent("admin_user_deleted", {
        target_username: user.username,
      });
      toast({
        title: "User deleted",
        description: `@${user.username} was removed.`,
      });
      if (detail?.user.id === user.id) setDetail(null);
      reload();
    } catch (error) {
      captureAdminException(error, { action: "admin_user_delete" });
      toast({
        title: "Could not delete user",
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <>
      <Panel
        title="User directory"
        hint="Search members, open their moderation history, and take action."
        actions={
          <AdminButton
            tone="outline"
            disabled={loading}
            onClick={reload}
            aria-label="Refresh users"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </AdminButton>
        }
      >
        <form
          className="mb-3 grid gap-2 sm:grid-cols-[1fr_150px_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch({ q: query.trim(), status });
          }}
        >
          <Field
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search username"
          />
          <SelectField
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="warned">Warned</option>
            <option value="banned">Banned</option>
          </SelectField>
          <AdminButton type="submit">
            <Search className="h-4 w-4" /> Search
          </AdminButton>
        </form>
        {users && users.length === 0 && (
          <EmptyState>No users match.</EmptyState>
        )}
        <div className="space-y-2">
          {users?.map((user) => (
            <Row key={user.id}>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-raw-text">
                  @{user.username}
                  <Tag tone={statusTone(user.status)}>{user.status}</Tag>
                  {user.tier && <Tag tone="gold">{TIER_LABELS[user.tier]}</Tag>}
                  {user.warnings > 0 && (
                    <Tag tone="red">{user.warnings} warnings</Tag>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-raw-silver/45">
                  Joined {formatDate(user.createdAt)} · Last seen{" "}
                  {formatDate(user.lastSeenAt)} · {user.tokenBalance} tokens
                </p>
              </div>
              <div className="flex gap-2">
                <AdminButton
                  tone="outline"
                  onClick={() => void openDetail(user)}
                >
                  Open
                </AdminButton>
                <AdminButton
                  tone="danger"
                  onClick={() => void removeUser(user)}
                  aria-label={`Delete ${user.username}`}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </AdminButton>
              </div>
            </Row>
          ))}
        </div>
      </Panel>
      {detail && (
        <UserDetailPanel
          detail={detail}
          onRefresh={() => void openDetail(detail.user)}
          onClose={() => setDetail(null)}
        />
      )}
      <AppealsPanel />
    </>
  );
}

const TIMEOUTS = [
  { label: "10 min", minutes: 10 },
  { label: "1 hour", minutes: 60 },
  { label: "24 hours", minutes: 60 * 24 },
];

function UserDetailPanel({
  detail,
  onRefresh,
  onClose,
}: {
  detail: UserDetail;
  onRefresh: () => void;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);
  const user = detail.user;

  async function run(action: ModerationAction, minutes?: number) {
    setPending(true);
    try {
      await moderateUser(user.username, action, minutes);
      captureAdminEvent("admin_user_moderated", {
        action,
        minutes,
        target_username: user.username,
      });
      toast({
        title: "Action applied",
        description: `@${user.username} updated.`,
      });
      onRefresh();
    } catch (error) {
      captureAdminException(error, {
        action: "admin_user_moderation",
        moderation_action: action,
      });
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Panel
      title={`@${user.username}`}
      hint="Full moderation record for this member."
      actions={
        <AdminButton tone="outline" onClick={onClose}>
          Close
        </AdminButton>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-raw-silver/55">
          <Tag tone={statusTone(user.status)}>{user.status}</Tag>
          {user.moderationStatus && user.moderationStatus !== user.status && (
            <Tag tone={statusTone(user.moderationStatus)}>
              {user.moderationStatus}
            </Tag>
          )}
          {user.tier && <Tag tone="gold">{TIER_LABELS[user.tier]}</Tag>}
          <span>{user.warnings} warnings</span>
          <span>{user.spamStrikes} spam strikes</span>
          {user.bannedUntil && (
            <span>Banned until {formatDate(user.bannedUntil)}</span>
          )}
          {detail.safetyScore && (
            <span>
              Safety {detail.safetyScore.score} (
              {detail.safetyScore.total_flags} flags,{" "}
              {detail.safetyScore.total_reports_against} reports)
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <AdminButton
            tone="outline"
            disabled={pending}
            onClick={() => void run("warn")}
          >
            <TriangleAlert className="h-4 w-4" /> Warn
          </AdminButton>
          {TIMEOUTS.map((timeout) => (
            <AdminButton
              key={timeout.minutes}
              tone="teal"
              disabled={pending}
              onClick={() => void run("timeout", timeout.minutes)}
            >
              Timeout {timeout.label}
            </AdminButton>
          ))}
          <AdminButton
            tone="danger"
            disabled={pending}
            onClick={() => void run("ban")}
          >
            <Ban className="h-4 w-4" /> Ban
          </AdminButton>
          <AdminButton
            tone="teal"
            disabled={pending}
            onClick={() => void run("unban")}
          >
            <ShieldCheck className="h-4 w-4" /> Unban
          </AdminButton>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-raw-silver/50">
            Moderation history
          </p>
          {detail.actions.length === 0 && (
            <EmptyState>No actions recorded.</EmptyState>
          )}
          <div className="space-y-1">
            {detail.actions.map((action) => (
              <p key={action.id} className="text-xs text-raw-silver/60">
                <span className="font-semibold text-raw-text">
                  {action.action}
                </span>{" "}
                · {formatDate(action.createdAt)}
                {action.reason && <span> — {action.reason}</span>}
                {action.expiresAt && (
                  <span> (until {formatDate(action.expiresAt)})</span>
                )}
              </p>
            ))}
          </div>
        </div>

        {detail.appeals.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-raw-silver/50">
              Appeals
            </p>
            <div className="space-y-1">
              {detail.appeals.map((appeal) => (
                <p key={appeal.id} className="text-xs text-raw-silver/60">
                  <Tag tone={statusTone(appeal.status)}>{appeal.status}</Tag>{" "}
                  {formatDate(appeal.createdAt)} — {appeal.text}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

function AppealsPanel() {
  const [status, setStatus] = useState<
    "pending" | "approved" | "denied" | "all"
  >("pending");
  const {
    data: appeals,
    loading,
    reload,
  } = useAsyncData(() => fetchAppeals(status), [status]);

  async function review(id: string, outcome: "approved" | "denied") {
    try {
      await reviewAppeal(id, outcome);
      captureAdminEvent("admin_appeal_reviewed", { status: outcome });
      toast({ title: `Appeal ${outcome}` });
      reload();
    } catch (error) {
      captureAdminException(error, { action: "admin_appeal_review" });
      toast({ title: "Could not review appeal" });
    }
  }

  return (
    <Panel
      title="Appeals"
      hint="Ban/timeout appeals submitted by members."
      actions={
        <div className="flex gap-2">
          <SelectField
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
            <option value="all">All</option>
          </SelectField>
          <AdminButton
            tone="outline"
            disabled={loading}
            onClick={reload}
            aria-label="Refresh appeals"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </AdminButton>
        </div>
      }
    >
      {appeals && appeals.length === 0 && (
        <EmptyState>No appeals in this view.</EmptyState>
      )}
      <div className="space-y-2">
        {appeals?.map((appeal) => (
          <Row key={appeal.id}>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-xs text-raw-silver/55">
                <Tag tone={statusTone(appeal.status)}>{appeal.status}</Tag>
                <span>{formatDate(appeal.createdAt)}</span>
                <span>user {appeal.userId}</span>
              </p>
              <p className="mt-1 text-sm text-raw-text">{appeal.text}</p>
              {appeal.reviewedBy && (
                <p className="mt-1 text-xs text-raw-silver/40">
                  Reviewed by {appeal.reviewedBy}{" "}
                  {formatDate(appeal.reviewedAt)}
                </p>
              )}
            </div>
            {appeal.status === "pending" && (
              <div className="flex gap-2">
                <AdminButton
                  tone="teal"
                  onClick={() => void review(appeal.id, "approved")}
                >
                  Approve
                </AdminButton>
                <AdminButton
                  tone="danger"
                  onClick={() => void review(appeal.id, "denied")}
                >
                  Deny
                </AdminButton>
              </div>
            )}
          </Row>
        ))}
      </div>
    </Panel>
  );
}
