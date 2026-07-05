import { useState } from "react";
import { Lock, LockOpen, RefreshCw, Trash2, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { captureAdminEvent, captureAdminException } from "@/lib/analytics";
import {
  deleteCommunityMessage,
  fetchCommunities,
  fetchCommunityMembers,
  fetchCommunityMessages,
  updateCommunity,
  type CommunityMessage,
  type CommunitySummary,
} from "@/lib/adminApi";
import { AdminButton, EmptyState, formatDate, Panel, Row, SelectField, Tag, useAsyncData } from "../ui";

export function CommunitiesTab() {
  const { data: communities, loading, reload } = useAsyncData(fetchCommunities);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = communities?.find((community) => community.id === selectedId) ?? null;

  async function toggleLock(community: CommunitySummary) {
    try {
      await updateCommunity(community.id, { locked: !community.locked });
      captureAdminEvent("admin_community_lock_toggled", { community_id: community.id, locked: !community.locked });
      toast({ title: community.locked ? "Room unlocked" : "Room locked", description: community.title });
      reload();
    } catch (error) {
      captureAdminException(error, { action: "admin_community_lock" });
      toast({ title: "Could not update room" });
    }
  }

  return (
    <>
      <Panel
        title="Community rooms"
        hint="Browse rooms, lock/unlock them, and inspect their chat."
        actions={
          <AdminButton tone="outline" disabled={loading} onClick={reload} aria-label="Refresh communities">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </AdminButton>
        }
      >
        {communities && communities.length === 0 && <EmptyState>No communities yet.</EmptyState>}
        <div className="space-y-2">
          {communities?.map((community) => (
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
                <AdminButton tone={community.locked ? "teal" : "danger"} onClick={() => void toggleLock(community)}>
                  {community.locked ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  {community.locked ? "Unlock" : "Lock"}
                </AdminButton>
              </div>
            </Row>
          ))}
        </div>
      </Panel>
      {selected && <CommunityInspector community={selected} />}
    </>
  );
}

function CommunityInspector({ community }: { community: CommunitySummary }) {
  const [filter, setFilter] = useState<"all" | "deleted" | "flagged">("all");
  const [view, setView] = useState<"messages" | "members">("messages");
  const messages = useAsyncData(() => fetchCommunityMessages(community.id, filter), [community.id, filter]);
  const members = useAsyncData(() => fetchCommunityMembers(community.id), [community.id]);

  async function removeMessage(message: CommunityMessage) {
    const reason = window.prompt(`Delete this message from @${message.senderName ?? "unknown"}?\nOptional reason:`);
    if (reason === null) return; // cancelled
    try {
      await deleteCommunityMessage(message.id, reason || undefined);
      captureAdminEvent("admin_message_deleted", { community_id: community.id });
      toast({ title: "Message removed" });
      messages.reload();
    } catch (error) {
      captureAdminException(error, { action: "admin_message_delete" });
      toast({ title: "Could not delete message" });
    }
  }

  return (
    <Panel
      title={`Inspecting: ${community.title}`}
      hint="Messages include deleted and flagged content; deletions here are soft deletes visible to the main app."
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
          {messages.data && messages.data.length === 0 && <EmptyState>No messages match this filter.</EmptyState>}
          {messages.data?.map((message) => (
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
                <AdminButton tone="danger" onClick={() => void removeMessage(message)} aria-label="Delete message">
                  <Trash2 className="h-4 w-4" />
                </AdminButton>
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
