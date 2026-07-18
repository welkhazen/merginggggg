import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import type { CommunityMessage } from "@/lib/adminApi";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function isCommunityRealtimeConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

function getClient(): SupabaseClient | null {
  if (!isCommunityRealtimeConfigured()) return null;
  client ??= createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return client;
}

function mapRealtimeMessage(row: Record<string, unknown>): CommunityMessage {
  return {
    id: String(row.id),
    communityId: String(row.community_id),
    senderId: typeof row.sender_id === "string" ? row.sender_id : null,
    senderName: typeof row.sender_name === "string" ? row.sender_name : null,
    text: typeof row.text === "string" ? row.text : "",
    createdAt: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    isDeleted: Boolean(row.is_deleted),
    deletedBy: typeof row.deleted_by === "string" ? row.deleted_by : null,
    deletedReason: typeof row.deleted_reason === "string" ? row.deleted_reason : null,
    moderationStatus: typeof row.moderation_status === "string" ? row.moderation_status : null,
    replyToSenderName: typeof row.reply_to_sender_name === "string" ? row.reply_to_sender_name : null,
    replyToText: typeof row.reply_to_text === "string" ? row.reply_to_text : null,
  };
}

export function subscribeToCommunityMessages(
  communityId: string,
  onChange: (message: CommunityMessage, eventType: "INSERT" | "UPDATE" | "DELETE") => void,
  onUnavailable: () => void,
): RealtimeChannel | null {
  const supabase = getClient();
  if (!supabase) return null;

  const channel = supabase
    .channel(`admin-community-messages:${communityId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "community_messages", filter: `community_id=eq.${communityId}` },
      (payload) => {
        const row = payload.eventType === "DELETE" ? payload.old : payload.new;
        if (!row?.id) return;
        onChange(mapRealtimeMessage(row), payload.eventType as "INSERT" | "UPDATE" | "DELETE");
      },
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") onUnavailable();
    });

  return channel;
}

export function unsubscribeFromCommunityMessages(channel: RealtimeChannel | null): void {
  if (!channel) return;
  void getClient()?.removeChannel(channel);
}
