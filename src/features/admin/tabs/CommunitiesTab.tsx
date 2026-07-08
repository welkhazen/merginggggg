import { useEffect, useMemo, useState } from "react";
import { Lock, LockOpen, MessageSquareReply, RefreshCw, Send, Trash2, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { captureAdminEvent, captureAdminException } from "@/lib/analytics";
import { isCommunityRealtimeConfigured, subscribeToCommunityMessages, unsubscribeFromCommunityMessages } from "@/lib/communityRealtime";
import {
  deleteCommunityMessage,
  fetchCommunities,
  fetchCommunityMembers,
  fetchCommunityMessages,
  sendCommunityMessage,
  updateCommunity,
  type CommunityMessage,
  type CommunitySummary,
} from "@/lib/adminApi";
import { AdminButton, EmptyState, formatDate, Panel, Row, SelectField, Tag, useAsyncData } from "../ui";

export function CommunitiesTab() {
  const { data: communities, loading, reload } = useAsyncData(fetchCommunities);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savingLockId, setSavingLockId] = useState<string | null>(null);

  const selected = communities?.find((community) => community.id === selectedId) ?? null;
  const visibleCommunities = useMemo(() => communities ?? [], [communities]);

  async function toggleLock(community: CommunitySummary) {
    if (savingLockId) return;
    const nextLocked = !community.locked;
    setSavingLockId(community.id);
    try {
      await updateCommunity(community.id, { locked: nextLocked });
      captureAdminEvent("admin_community_lock_toggled", { community_id: community.id, locked: nextLocked });
      toast({ title: nextLocked ? "Room locked" : "Room unlocked", description: community.title });
      reload();
    } catch (error) {
      captureAdminException(error, { action: "admin_community_lock" });
      toast({ title: community.locked ? "Could not unlock room" : "Could not lock room" });
    } finally {
      setSavingLockId(null);
    }
  }

  return (
    <>
      <Panel
        title="Community rooms"
        hint="Live moderator view for the current three unlocked rooms. Inspect to watch chat in near real time and reply from the dashboard."
        actions={
          <AdminButton tone="outline" disabled={loading} onClick={reload} aria-label="Refresh communities">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </AdminButton>
        }
      >
        {communities && communities.length === 0 && <EmptyState>No communities yet.</EmptyState>}
        <div className="space-y-2">
          {visibleCommunities.map((community) => {
            const savingLock = savingLockId === community.id;
            return (
              <Row key={community.id}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-raw-text">
                    {community.title} {community.abbr && <span className="text-raw-silver/40">({community.abbr})</span>}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-raw-silver/50">
                    {community.status && <Tag tone={community.status === "Active" ? "green" : "teal"}>{community.status}</Tag>}
                    {community.locked && <Tag tone="red">Locked</Tag>}
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {community.memberCount}</span>
                    {community.topic && <span className="truncate">{community.topic}</span>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <AdminButton tone="outline" onClick={() => setSelectedId(selectedId === community.id ? null : community.id)}>
                    {selectedId === community.id ? "Close" : "Inspect"}
                  </AdminButton>
                  <AdminButton tone={community.locked ? "teal" : "danger"} disabled={savingLock} onClick={() => void toggleLock(community)}>
                    {community.locked ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    {savingLock ? "Saving" : community.locked ? "Unlock" : "Lock"}
                  </AdminButton>
                </div>
              </Row>
            );
          })}
        </div>
      </Panel>
      {selected && <CommunityInspector community={selected} />}
    </>
  );
}

function CommunityInspector({ community }: { community: CommunitySummary }) {
  const [filter, setFilter] = useState<"all" | "deleted" | "flagged">("all");
  const [view, setView] = useState<"messages" | "members">("messages");
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<CommunityMessage | null>(null);
  const [sending, setSending] = useState(false);
  const { data: messageData, setData: setMessageData, reload: reloadMessages } = useAsyncData(() => fetchCommunityMessages(community.id, filter), [community.id, filter]);
  const [realtimeFallback, setRealtimeFallback] = useState(!isCommunityRealtimeConfigured());
  const members = useAsyncData(() => fetchCommunityMembers(community.id), [community.id]);

  useEffect(() => {
    setRealtimeFallback(!isCommunityRealtimeConfigured());
  }, [community.id]);

  useEffect(() => {
    if (view !== "messages") return;

    const channel = subscribeToCommunityMessages(
      community.id,
      (message, eventType) => {
        if (filter === "deleted" && !message.isDeleted) return;
        if (filter === "flagged" && !message.moderationStatus) return;

        setMessageData((current) => {
          const messages = current ?? [];
          if (eventType === "DELETE") return messages.filter((item) => item.id !== message.id);

          const next = [message, ...messages.filter((item) => item.id !== message.id)];
          return next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50);
        });
      },
      () => {
        setRealtimeFallback(true);
      },
    );

    if (!channel) {
      setRealtimeFallback(true);
      return;
    }

    setRealtimeFallback(false);
    return () => unsubscribeFromCommunityMessages(channel);
  }, [community.id, filter, setMessageData, view]);

  useEffect(() => {
    if (view !== "messages" || !realtimeFallback) return;
    const timer = window.setInterval(() => {
      reloadMessages();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [realtimeFallback, reloadMessages, view]);

  async function removeMessage(message: CommunityMessage) {
    const reason = window.prompt(`Delete this message from @${message.senderName ?? "unknown"}?\nOptional reason:`);
    if (reason === null) return; // cancelled
    try {
      await deleteCommunityMessage(message.id, reason || undefined);
      captureAdminEvent("admin_message_deleted", { community_id: community.id });
      toast({ title: "Message removed" });
      reloadMessages();
    } catch (error) {
      captureAdminException(error, { action: "admin_message_delete" });
      toast({ title: "Could not delete message" });
    }
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      await sendCommunityMessage(community.id, { text, replyToMessageId: replyTo?.id });
      captureAdminEvent("admin_community_message_sent", { community_id: community.id, reply: Boolean(replyTo) });
      setDraft("");
      setReplyTo(null);
      reloadMessages();
      toast({ title: "Message sent" });
    } catch (error) {
      captureAdminException(error, { action: "admin_community_message_send" });
      toast({ title: "Could not send message", description: error instanceof Error ? error.message : undefined });
    } finally {
      setSending(false);
    }
  }

  return (
    <Panel
      title={`Inspecting: ${community.title}`}
      hint={realtimeFallback ? "Realtime is unavailable, so this view is temporarily falling back to 3-second refreshes." : "Realtime is active for messages; deletions here are soft deletes visible to the main app."}
      actions={
        <div className="flex gap-2">
          <SelectField value={view} onChange={(event) => setView(event.target.value as typeof view)}>
            <option value="messages">Messages</option>
            <option value="members">Members</option>
          </SelectField>
          {view === "messages" && (
            <SelectField value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
              <option value="all">All</option>
              <option value="deleted">Deleted</option>
              <option value="flagged">Flagged</option>
            </SelectField>
          )}
        </div>
      }
    >
      {view === "messages" ? (
        <div className="space-y-2">
          <form onSubmit={sendMessage} className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3">
            {replyTo && (
              <div className="mb-2 flex items-start justify-between gap-3 rounded-lg border border-raw-border/30 bg-raw-black/40 px-3 py-2 text-xs text-raw-silver/55">
                <span className="min-w-0 truncate">
                  Replying to <b className="text-raw-text">@{replyTo.senderName ?? "unknown"}</b>: {replyTo.text}
                </span>
                <button type="button" className="text-raw-silver/45 hover:text-raw-text" onClick={() => setReplyTo(null)}>
                  Clear
                </button>
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={1000}
                placeholder={`Reply as moderator in ${community.title}`}
                className="min-h-11 rounded-xl border border-raw-border/30 bg-raw-black/45 px-3 text-sm text-raw-text placeholder:text-raw-silver/25 focus:border-cyan-300/50 focus:outline-none"
              />
              <AdminButton type="submit" tone="teal" disabled={sending || !draft.trim()}>
                <Send className="h-4 w-4" /> {sending ? "Sending" : "Send"}
              </AdminButton>
            </div>
          </form>
          {messageData && messageData.length === 0 && <EmptyState>No messages match this filter.</EmptyState>}
          {messageData?.map((message) => (
            <Row key={message.id}>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-xs text-raw-silver/55">
                  <span className="font-semibold text-raw-text">@{message.senderName ?? "unknown"}</span>
                  <span>{formatDate(message.createdAt)}</span>
                  {message.isDeleted && <Tag tone="red">Deleted{message.deletedBy ? ` by ${message.deletedBy}` : ""}</Tag>}
                  {message.moderationStatus && message.moderationStatus !== "removed" && (
                    <Tag tone="gold">{message.moderationStatus}</Tag>
                  )}
                </p>
                {message.replyToText && (
                  <p className="mt-1 truncate border-l-2 border-raw-border/40 pl-2 text-xs text-raw-silver/40">
                    @{message.replyToSenderName}: {message.replyToText}
                  </p>
                )}
                <p className={`mt-1 text-sm ${message.isDeleted ? "text-raw-silver/35 line-through" : "text-raw-text"}`}>
                  {message.text}
                </p>
                {message.deletedReason && <p className="mt-1 text-xs text-raw-silver/40">Reason: {message.deletedReason}</p>}
              </div>
              {!message.isDeleted && (
                <div className="flex gap-2">
                  <AdminButton tone="outline" onClick={() => setReplyTo(message)} aria-label="Reply to message">
                    <MessageSquareReply className="h-4 w-4" />
                  </AdminButton>
                  <AdminButton tone="danger" onClick={() => void removeMessage(message)} aria-label="Delete message">
                    <Trash2 className="h-4 w-4" />
                  </AdminButton>
                </div>
              )}
            </Row>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {members.data && members.data.length === 0 && <EmptyState>No members.</EmptyState>}
          {members.data?.map((member) => (
            <Row key={member.userId}>
              <div>
                <p className="text-sm font-semibold text-raw-text">@{member.username ?? member.userId}</p>
                <p className="text-xs text-raw-silver/45">
                  Joined {formatDate(member.joinedAt)} · Last seen {formatDate(member.lastSeenAt)}
                </p>
              </div>
            </Row>
          ))}
        </div>
      )}
    </Panel>
  );
}
