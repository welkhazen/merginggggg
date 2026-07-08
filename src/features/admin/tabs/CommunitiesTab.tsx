import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Lock, LockOpen, MessageSquareReply, RefreshCw, Search, Send, Trash2, Users, X } from "lucide-react";
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

function formatChatDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Earlier";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatChatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

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
  const [searchQuery, setSearchQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<CommunityMessage | null>(null);
  const [sending, setSending] = useState(false);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const { data: messageData, setData: setMessageData, reload: reloadMessages } = useAsyncData(() => fetchCommunityMessages(community.id, filter), [community.id, filter]);
  const [realtimeFallback, setRealtimeFallback] = useState(!isCommunityRealtimeConfigured());
  const members = useAsyncData(() => fetchCommunityMembers(community.id), [community.id]);
  const filteredMessages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const messages = [...(messageData ?? [])].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (!query) return messages;
    return messages.filter((message) => {
      const haystack = [
        message.senderName,
        message.text,
        message.replyToSenderName,
        message.replyToText,
        message.moderationStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [messageData, searchQuery]);
  const groupedMessages = useMemo(() => {
    const groups: Array<{ label: string; messages: CommunityMessage[] }> = [];
    filteredMessages.forEach((message) => {
      const label = formatChatDay(message.createdAt);
      const currentGroup = groups[groups.length - 1];
      if (!currentGroup || currentGroup.label !== label) {
        groups.push({ label, messages: [message] });
        return;
      }
      currentGroup.messages.push(message);
    });
    return groups;
  }, [filteredMessages]);

  useEffect(() => {
    setRealtimeFallback(!isCommunityRealtimeConfigured());
    setSearchQuery("");
    setReplyTo(null);
  }, [community.id]);

  useLayoutEffect(() => {
    if (!messagesRef.current || searchQuery.trim()) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [filteredMessages, searchQuery]);

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
        <div className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-raw-border/20 bg-raw-black/35">
          <div className="flex flex-wrap items-center gap-2 border-b border-raw-border/15 px-3 py-2">
            <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-raw-border/25 bg-raw-surface/40 px-3 py-1.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-raw-silver/40" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search this group chat"
                className="w-full bg-transparent text-sm text-raw-text placeholder:text-raw-silver/30 focus:outline-none"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="rounded-full p-0.5 text-raw-silver/40 hover:text-raw-text" aria-label="Clear search">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <Tag tone={realtimeFallback ? "gold" : "green"}>{realtimeFallback ? "3s refresh" : "Realtime"}</Tag>
          </div>

          <div ref={messagesRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            {groupedMessages.map((group) => (
              <div key={group.label} className="space-y-3">
                <div className="sticky top-0 z-10 flex justify-center py-1">
                  <span className="rounded-full border border-raw-border/20 bg-raw-black/85 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-raw-silver/40 backdrop-blur">
                    {group.label}
                  </span>
                </div>
                {group.messages.map((message) => {
                  const isModeratorMessage = (message.senderName ?? "").toLowerCase().includes("moderator") || message.senderId === "admin";
                  return (
                    <article key={message.id} className={`flex w-full ${isModeratorMessage ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`group/msg max-w-[88%] rounded-2xl border px-3.5 py-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.22)] ${
                          isModeratorMessage
                            ? "border-raw-gold/25 bg-raw-gold/[0.09] text-raw-text"
                            : "border-raw-border/25 bg-raw-surface/30 text-raw-silver/80"
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.12em]">
                          <span className={isModeratorMessage ? "text-raw-gold/85" : "text-raw-gold/65"}>@{message.senderName ?? "unknown"}</span>
                          <span className="text-raw-silver/30">{formatChatTime(message.createdAt)}</span>
                          {message.isDeleted && <Tag tone="red">Deleted</Tag>}
                          {message.moderationStatus && message.moderationStatus !== "removed" && <Tag tone="gold">{message.moderationStatus}</Tag>}
                        </div>
                        {message.replyToText && (
                          <div className="mt-2 rounded-xl border border-raw-border/20 bg-raw-black/20 px-3 py-2 text-xs text-raw-silver/55">
                            <p className="font-medium text-raw-gold/75">Replying to @{message.replyToSenderName ?? "unknown"}</p>
                            <p className="mt-1 truncate">{message.replyToText}</p>
                          </div>
                        )}
                        <p className={`mt-2 text-sm leading-relaxed ${message.isDeleted ? "italic text-raw-silver/40 line-through" : ""}`}>
                          {message.text}
                        </p>
                        {message.deletedReason && <p className="mt-2 text-xs text-raw-silver/40">Reason: {message.deletedReason}</p>}
                        {!message.isDeleted && (
                          <div className="mt-3 flex flex-wrap justify-end gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover/msg:opacity-100">
                            <button
                              type="button"
                              onClick={() => setReplyTo(message)}
                              className="inline-flex items-center gap-1 rounded-full border border-raw-border/25 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-raw-silver/70 transition-colors hover:border-raw-gold/35 hover:text-raw-gold"
                            >
                              <MessageSquareReply className="h-3 w-3" /> Reply
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeMessage(message)}
                              className="inline-flex items-center gap-1 rounded-full border border-red-400/25 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-red-200/80 transition-colors hover:bg-red-500/10"
                            >
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ))}

            {messageData && messageData.length === 0 && <EmptyState>No messages match this filter.</EmptyState>}
            {messageData && messageData.length > 0 && groupedMessages.length === 0 && <EmptyState>No messages match your search.</EmptyState>}
          </div>

          <form onSubmit={sendMessage} className="border-t border-raw-border/15 bg-raw-black/35 px-3 py-3">
            {replyTo && (
              <div className="mb-2 flex items-start justify-between gap-3 rounded-xl border border-raw-gold/20 bg-raw-gold/[0.06] px-3 py-2 text-xs text-raw-silver/60">
                <span className="min-w-0 truncate">
                  Replying to <b className="text-raw-text">@{replyTo.senderName ?? "unknown"}</b>: {replyTo.text}
                </span>
                <button type="button" className="text-raw-silver/45 hover:text-raw-text" onClick={() => setReplyTo(null)} aria-label="Clear reply">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <div className="flex gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/[0.06] p-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={1000}
                placeholder={`Reply as moderator in ${community.title}`}
                className="min-h-11 flex-1 rounded-xl border border-raw-border/20 bg-raw-black/45 px-3 text-sm text-raw-text placeholder:text-raw-silver/25 focus:border-cyan-300/50 focus:outline-none"
              />
              <AdminButton type="submit" tone="teal" disabled={sending || !draft.trim()}>
                <Send className="h-4 w-4" /> {sending ? "Sending" : "Send"}
              </AdminButton>
            </div>
          </form>
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
