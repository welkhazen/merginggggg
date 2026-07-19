import { useEffect, useState } from "react";
import { Ban, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { captureAdminEvent, captureAdminException } from "@/lib/analytics";
import {
  fetchStats,
  moderateUser,
  searchUsers,
  type ManagedUser,
  type ModerationAction,
} from "@/lib/adminApi";
import { AdminButton, EmptyState, Field, Panel } from "../ui";
import { useAsyncData } from "../useAsyncData";

const TIMEOUTS = [
  { label: "10 min", minutes: 10 },
  { label: "1 hour", minutes: 60 },
  { label: "24 hours", minutes: 60 * 24 },
];

const STAT_CARDS: Array<{ key: string; label: string; alert?: boolean }> = [
  { key: "openReports", label: "Open reports", alert: true },
  { key: "unreviewedFlags", label: "Unreviewed flags", alert: true },
  {
    key: "pendingCommunityRequests",
    label: "Pending room requests",
    alert: true,
  },
  { key: "pendingAppeals", label: "Pending appeals", alert: true },
  { key: "pendingDonations", label: "Pending donations" },
  { key: "pendingTokenRequests", label: "Pending token requests" },
  { key: "pendingWaitlist", label: "Waitlist signups", alert: true },
  { key: "openErrors", label: "Open errors", alert: true },
  { key: "totalUsers", label: "Total users" },
  { key: "newUsers7d", label: "New users (7d)" },
  { key: "bannedUsers", label: "Banned users" },
  { key: "totalCommunities", label: "Communities" },
  { key: "lockedCommunities", label: "Locked rooms" },
];

export function OverviewTab() {
  const { data: stats, loading, reload } = useAsyncData(fetchStats);

  return (
    <>
      <Panel
        title="Overview"
        hint="Live counts from the myraw.app database."
        actions={
          <AdminButton
            tone="outline"
            disabled={loading}
            onClick={reload}
            aria-label="Refresh stats"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </AdminButton>
        }
      >
        {!stats && !loading ? (
          <EmptyState>Could not load stats.</EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {STAT_CARDS.map((card) => {
              const value = stats
                ? (stats as unknown as Record<string, number>)[card.key]
                : null;
              const highlight =
                card.alert && typeof value === "number" && value > 0;
              return (
                <div
                  key={card.key}
                  className={`rounded-xl border px-3 py-3 ${highlight ? "border-raw-gold/50 bg-raw-gold/10" : "border-raw-border/25 bg-raw-black/30"}`}
                >
                  <p className="text-2xl font-semibold text-raw-text">
                    {value ?? "…"}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-raw-silver/45">
                    {card.label}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
      <QuickModerate />
    </>
  );
}

function QuickModerate() {
  const [username, setUsername] = useState("");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [matches, setMatches] = useState<ManagedUser[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const query = username.trim();
    if (query.length < 1) {
      setMatches([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timeoutId = window.setTimeout(() => {
      searchUsers(query, 8)
        .then((users) => {
          if (cancelled) return;
          setMatches(users);
        })
        .catch((error) => {
          if (cancelled) return;
          captureAdminException(error, { action: "admin_user_lookup", query });
          setMatches([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [username]);

  async function run(action: ModerationAction, minutes?: number) {
    const target = username.trim();
    if (!target) return toast({ title: "Enter a username" });
    setPending(`${action}-${minutes ?? ""}`);
    try {
      await moderateUser(target, action, minutes, reason.trim() || undefined);
      captureAdminEvent("admin_user_moderated", {
        action,
        minutes,
        target_username: target,
      });
      toast({ title: "Action applied", description: `@${target} updated.` });
    } catch (error) {
      captureAdminException(error, {
        action: "admin_user_moderation",
        moderation_action: action,
      });
      toast({
        title: "Action failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setPending(null);
    }
  }

  return (
    <Panel
      title="Moderate a user"
      hint="Warn, time out, ban, or unban by username."
    >
      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="relative">
            <Field
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Username"
              autoComplete="off"
            />
            {(searching || matches.length > 0) && (
              <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-xl border border-raw-border/30 bg-raw-black/95 shadow-2xl">
                {searching ? (
                  <p className="px-3 py-2 text-xs text-raw-silver/45">
                    Searching users...
                  </p>
                ) : (
                  matches.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setUsername(user.username);
                        setMatches([]);
                      }}
                      className="flex w-full items-center justify-between gap-3 border-b border-raw-border/15 px-3 py-2 text-left text-sm text-raw-text transition-colors last:border-b-0 hover:bg-raw-gold/10"
                    >
                      <span>@{user.username}</span>
                      <span className="text-[11px] uppercase tracking-wide text-raw-silver/40">
                        {user.status}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <Field
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Reason (optional)"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminButton
            tone="outline"
            disabled={pending !== null}
            onClick={() => void run("warn")}
          >
            <TriangleAlert className="h-4 w-4" /> Warn
          </AdminButton>
          {TIMEOUTS.map((timeout) => (
            <AdminButton
              key={timeout.minutes}
              tone="teal"
              disabled={pending !== null}
              onClick={() => void run("timeout", timeout.minutes)}
            >
              Timeout {timeout.label}
            </AdminButton>
          ))}
          <AdminButton
            tone="danger"
            disabled={pending !== null}
            onClick={() => void run("ban")}
          >
            <Ban className="h-4 w-4" /> Ban
          </AdminButton>
          <AdminButton
            tone="teal"
            disabled={pending !== null}
            onClick={() => void run("unban")}
          >
            <ShieldCheck className="h-4 w-4" /> Unban
          </AdminButton>
        </div>
      </div>
    </Panel>
  );
}
