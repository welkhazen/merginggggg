import { Router } from "express";
import { z } from "zod";
import { writeAudit } from "../../lib/audit";
import { insertRow, selectRows, updateRows } from "../../lib/supabaseAdmin";
import { adminSession } from "../../middleware/adminAuth";

type CommunityRow = {
  id: string;
  abbr: string | null;
  title: string;
  topic: string | null;
  status: string | null;
  locked: boolean | null;
  created_at: string;
};

type MessageRow = {
  id: string;
  community_id: string;
  sender_id: string | null;
  sender_name: string | null;
  text: string;
  created_at: string;
  is_deleted: boolean | null;
  deleted_by: string | null;
  deleted_reason: string | null;
  moderation_status: string | null;
  reply_to_sender_name: string | null;
  reply_to_text: string | null;
};

const communityUpdateSchema = z.object({
  locked: z.boolean().optional(),
  status: z.string().trim().min(1).max(40).optional(),
});

const deleteMessageSchema = z.object({
  reason: z.string().trim().max(300).optional(),
});

const messagesQuerySchema = z.object({
  filter: z.enum(["all", "deleted", "flagged"]).default("all"),
  before: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const communitiesRouter = Router();

communitiesRouter.get("/communities", async (_req, res) => {
  const [communities, memberships] = await Promise.all([
    selectRows<CommunityRow>("communities", {
      select: "id,abbr,title,topic,status,locked,created_at",
      order: "title.asc",
    }),
    selectRows<{ community_id: string }>("community_members", { select: "community_id" }),
  ]);

  const memberCounts = new Map<string, number>();
  for (const membership of memberships) {
    memberCounts.set(membership.community_id, (memberCounts.get(membership.community_id) ?? 0) + 1);
  }

  return res.status(200).json({
    communities: communities.map((community) => ({
      id: community.id,
      abbr: community.abbr,
      title: community.title,
      topic: community.topic,
      status: community.status,
      locked: Boolean(community.locked),
      createdAt: community.created_at,
      memberCount: memberCounts.get(community.id) ?? 0,
    })),
  });
});

communitiesRouter.patch("/communities/:id", async (req, res) => {
  const parsed = communityUpdateSchema.safeParse(req.body);
  if (!parsed.success || (parsed.data.locked === undefined && parsed.data.status === undefined)) {
    return res.status(400).json({ error: "invalid_payload" });
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.locked !== undefined) updates.locked = parsed.data.locked;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;

  const rows = await updateRows<CommunityRow>("communities", { id: `eq.${req.params.id}` }, updates);
  if (rows.length === 0) return res.status(404).json({ error: "community_not_found" });

  writeAudit(adminSession(res), {
    action: "community_updated",
    targetType: "community",
    targetId: req.params.id,
    targetLabel: rows[0].title,
    details: updates as Record<string, unknown>,
  });
  return res.status(200).json({ ok: true });
});

communitiesRouter.get("/communities/:id/messages", async (req, res) => {
  const parsed = messagesQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "invalid_query" });

  const params: Record<string, string | number> = {
    select:
      "id,community_id,sender_id,sender_name,text,created_at,is_deleted,deleted_by,deleted_reason,moderation_status,reply_to_sender_name,reply_to_text",
    community_id: `eq.${req.params.id}`,
    order: "created_at.desc",
    limit: parsed.data.limit,
  };
  if (parsed.data.before) params.created_at = `lt.${parsed.data.before}`;
  if (parsed.data.filter === "deleted") params.is_deleted = "eq.true";
  if (parsed.data.filter === "flagged") params.moderation_status = "not.is.null";

  const rows = await selectRows<MessageRow>("community_messages", params);
  return res.status(200).json({
    messages: rows.map((row) => ({
      id: row.id,
      communityId: row.community_id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      text: row.text,
      createdAt: row.created_at,
      isDeleted: Boolean(row.is_deleted),
      deletedBy: row.deleted_by,
      deletedReason: row.deleted_reason,
      moderationStatus: row.moderation_status,
      replyToSenderName: row.reply_to_sender_name,
      replyToText: row.reply_to_text,
    })),
  });
});

communitiesRouter.get("/communities/:id/members", async (req, res) => {
  const rows = await selectRows<{
    community_id: string;
    user_id: string;
    username: string | null;
    joined_at: string | null;
    last_seen_at: string | null;
  }>("community_members", {
    select: "community_id,user_id,username,joined_at,last_seen_at",
    community_id: `eq.${req.params.id}`,
    order: "joined_at.desc",
  });
  return res.status(200).json({
    members: rows.map((row) => ({
      userId: row.user_id,
      username: row.username,
      joinedAt: row.joined_at,
      lastSeenAt: row.last_seen_at,
    })),
  });
});

communitiesRouter.delete("/messages/:id", async (req, res) => {
  const parsed = deleteMessageSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  const session = adminSession(res);
  const rows = await updateRows<MessageRow>(
    "community_messages",
    { id: `eq.${req.params.id}` },
    {
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: session.username,
      deleted_reason: parsed.data.reason ?? "removed_by_staff",
      moderation_status: "removed",
    },
  );
  if (rows.length === 0) return res.status(404).json({ error: "message_not_found" });

  const message = rows[0];
  if (message.sender_id) {
    void insertRow("moderation_actions", {
      target_user_id: message.sender_id,
      actor_id: session.userId,
      action: "delete_message",
      reason: parsed.data.reason ?? null,
      message_id: message.id,
      community_id: message.community_id,
    }).catch((error) => console.error("[moderation] failed to record delete_message", error));
  }

  writeAudit(session, {
    action: "message_deleted",
    targetType: "message",
    targetId: message.id,
    targetLabel: message.sender_name ?? undefined,
    details: { communityId: message.community_id, reason: parsed.data.reason ?? null },
  });
  return res.status(200).json({ ok: true });
});
