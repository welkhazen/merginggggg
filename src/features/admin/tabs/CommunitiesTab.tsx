import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Lock, LockOpen, MessageSquareReply, RefreshCw, Search, Send, Trash2, Users, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { captureAdminEvent, captureAdminException } from "@/lib/analytics";
import { isCommunityRealtimeConfigured, subscribeToCommunityMessages, unsubscribeFromCommunityMessages } from "@/lib/communityRealtime";
import {
  deleteCommunity,
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sectionsOpen, setSectionsOpen] = useState({ unlocked: true, locked: true });

  const selected = communities?.find((community) => community.id === selectedId) ?? null;
  const groupedCommunities = useMemo(() => {
    const list = communities ?? [];
    return {
      unlocked: list.filter((community) => !community.locked),
      locked: list.filter((community) => community.locked),
    };
  }, [communities]);

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

  function requestDelete(community: CommunitySummary) {
    toast({
      title: `Delete ${community.title}?`,
      description: "This permanently removes the room and its messages. This cannot be undone.",
      action: (
        <ToastAction altText={`Delete ${community.title}`} onClick={() => void confirmDelete(community)}>
          Delete
        </ToastAction>
      ),
    });
  }

  async function confirmDelete(community: CommunitySummary) {
    if (deletingId) return;
    setDeletingId(community.id);
    try {
      await deleteCommunity(community.id);
      captureAdminEvent("admin_community_deleted", { community_id: community.id });
      toast({ title: "Room deleted", description: community.title });
      if (selectedId === community.id) setSelectedId(null);
      reload();
    } catch (error) {
      captureAdminException(error, { action: "admin_community_delete" });
      toast({ title: "Could not delete room", description: error instanceof Error ? error.message : undefined });
    } finally {
      setDeletingId(null);
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
        <div className="space-y-4">
          {([
            { key: "unlocked" as const, title: "Unlocked rooms", tone: "green" as const, rooms: groupedCommunities.unlocked },
            { key: "locked" as const, title: "Locked rooms", tone: "red" as const, rooms: groupedCommunities.locked },
          ]).map((section) => {
            const isOpen = sectionsOpen[section.key];
            return (
              <section key={section.key} className="rounded-2xl border border-raw-border/20 bg-raw-black/20">
                <button
                  type="button"
                  onClick={() => setSectionsOpen((current) => ({ ...current, [section.key]: !current[section.key] }))}
                  className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Tag tone={section.tone}>{section.title}</Tag>
                    <span className="text-xs text-raw-silver/45">{section.rooms.length} room{section.rooms.length === 1 ? "" : "s"}</span>
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-raw-silver/55">
                    {isOpen ? "Collapse" : "Expand"}
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </span>
                </button>

                {isOpen && (
                  <div className="space-y-2 border-t border-raw-border/15 p-2">
                    {section.rooms.length === 0 && (
                      <p className="px-2 py-4 text-sm text-raw-silver/40">No {section.key} rooms.</p>
                    )}
                    {section.rooms.map((community) => {
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
                            <AdminButton
                              tone="danger"
                              disabled={deletingId === community.id}
                              onClick={() => requestDelete(community)}
                              aria-label={`Delete ${community.title}`}
                            >
                              <Trash2 className="h-4 w-4" />
                              {deletingId === community.id ? "Deleting" : "Delete"}
                            </AdminButton>
                          </div>
                        </Row>
                      );
                    })}
                  </div>
                )}
              </section>
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
        <div className="rounded-[22px] bg-[#eef3f4] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.22)] [background-image:radial-gradient(rgba(18,63,76,.13)_1px,transparent_1px)] [background-size:9px_9px]">
          <div className="mb-4 rounded-[18px] border border-[#ded8cb] bg-[#f8f5ee] px-5 py-4 text-[#1f2528] shadow-[0_8px_28px_rgba(0,0,0,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#ddd6c9] bg-white text-sm font-semibold text-[#111827]">
                  {community.abbr?.slice(0, 2) ?? "RA"}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-xl leading-tight tracking-wide text-[#171717]">{community.title}</p>
                  <p className="mt-1 text-xs text-[#77736b]">{community.topic ?? "Live community room"}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#d8d0c2] bg-white px-3 py-1 text-[11px] text-[#6f6a62]">
                  {realtimeFallback ? "3s refresh" : "Realtime"}
                </span>
                <span className="rounded-full border border-lime-300 bg-lime-50 px-3 py-1 text-[11px] text-lime-700">
                  Admin preview
                </span>
              </div>
            </div>
          </div>

          <div className="flex h-[min(760px,calc(100dvh-180px))] min-h-[620px] flex-col overflow-hidden rounded-[18px] border border-[#ded8cb] bg-[#fbfaf7] text-[#1f2528] shadow-[0_10px_36px_rgba(0,0,0,0.1)]">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#e6e0d5] px-4 py-3">
            <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-[#d9d2c7] bg-white px-3 py-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-[#9b968d]" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search this group chat"
                className="w-full bg-transparent text-sm text-[#1f2528] placeholder:text-[#b9b3aa] focus:outline-none"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="rounded-full p-0.5 text-[#9b968d] hover:text-[#1f2528]" aria-label="Clear search">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <SelectField value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="border-[#d9d2c7] bg-white text-[#1f2528]">
              <option value="all">All</option>
              <option value="deleted">Deleted</option>
              <option value="flagged">Flagged</option>
            </SelectField>
          </div>

          <div ref={messagesRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {groupedMessages.map((group) => (
              <div key={group.label} className="space-y-3">
                <div className="sticky top-0 z-10 flex justify-center py-1">
                  <span className="border border-[#ded8cb] bg-[#fbfaf7] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#9b968d] shadow-sm">
                    {group.label}
                  </span>
                </div>
                {group.messages.map((message) => {
                  const isModeratorMessage = (message.senderName ?? "").toLowerCase().includes("moderator") || message.senderId === "admin";
                  return (
                    <article
                      key={message.id}
                      className={`group/msg flex min-h-8 w-full items-center gap-2 border px-3 py-2 text-sm ${
                        isModeratorMessage
                          ? "border-lime-300 bg-lime-50/80"
                          : "border-[#e4ddcf] bg-[#fbfaf7]"
                      }`}
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#d7cfbf] bg-[#15120f] text-[10px] font-semibold text-[#f4c536]">
                        {(message.senderName ?? "?").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className={isModeratorMessage ? "text-lime-700 text-xs font-semibold" : "text-lime-600 text-xs font-semibold"}>@{message.senderName ?? "unknown"}:</span>
                          <span className={`min-w-0 break-words text-xs ${message.isDeleted ? "italic text-[#9b968d] line-through" : "text-[#3b3a36]"}`}>
                            {message.text}
                          </span>
                          <span className="shrink-0 text-[10px] text-[#9b968d]">{formatChatTime(message.createdAt)}</span>
                          {message.isDeleted && <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-red-500">Deleted</span>}
                          {message.moderationStatus && message.moderationStatus !== "removed" && (
                            <span className="rounded border border-red-300 bg-red-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-red-600">{message.moderationStatus}</span>
                          )}
                        </div>
                        {message.replyToText && (
                          <p className="mt-1 truncate border-l-2 border-[#d8d0c2] pl-2 text-[11px] text-[#8f887e]">
                            @{message.replyToSenderName ?? "unknown"}: {message.replyToText}
                          </p>
                        )}
                      </div>
                      {!message.isDeleted && (
                        <div className="ml-auto flex shrink-0 gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover/msg:opacity-100">
                          <button
                            type="button"
                            onClick={() => setReplyTo(message)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#ded8cb] bg-white text-[#7c766d] hover:border-lime-300 hover:text-lime-700"
                            aria-label="Reply to message"
                          >
                            <MessageSquareReply className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeMessage(message)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
                            aria-label="Delete message"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ))}

            {messageData && messageData.length === 0 && <EmptyState>No messages match this filter.</EmptyState>}
            {messageData && messageData.length > 0 && groupedMessages.length === 0 && <EmptyState>No messages match your search.</EmptyState>}
          </div>

          <form onSubmit={sendMessage} className="border-t border-[#e6e0d5] bg-[#fbfaf7] px-3 py-3">
            {replyTo && (
              <div className="mb-2 flex items-start justify-between gap-3 rounded-xl border border-lime-300 bg-lime-50 px-3 py-2 text-xs text-[#6f6a62]">
                <span className="min-w-0 truncate">
                  Replying to <b className="text-[#1f2528]">@{replyTo.senderName ?? "unknown"}</b>: {replyTo.text}
                </span>
                <button type="button" className="text-[#8f887e] hover:text-[#1f2528]" onClick={() => setReplyTo(null)} aria-label="Clear reply">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <div className="flex gap-2 rounded-xl border border-[#ded8cb] bg-white p-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={1000}
                placeholder="Type a message..."
                className="min-h-11 flex-1 rounded-xl border border-transparent bg-transparent px-3 text-sm text-[#1f2528] placeholder:text-[#bbb5ad] focus:border-lime-300 focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#ded8cb] bg-white text-[#6f6a62] transition-colors hover:border-lime-300 hover:text-lime-700 disabled:opacity-45"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
          </div>
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
