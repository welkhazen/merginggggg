import { Router } from "express";
import { z } from "zod";
import { selectRows } from "../../lib/supabaseAdmin.js";

const auditQuerySchema = z.object({
  action: z.string().trim().max(60).optional(),
  actor: z.string().trim().max(48).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const auditLogRouter = Router();

auditLogRouter.get("/audit-log", async (req, res) => {
  const parsed = auditQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "invalid_query" });

  const params: Record<string, string | number> = {
    select: "id,actor_id,actor_username,actor_tier,action,target_type,target_id,target_label,details,created_at",
    order: "created_at.desc",
    limit: parsed.data.limit,
    offset: parsed.data.offset,
  };
  if (parsed.data.action) params.action = `eq.${parsed.data.action}`;
  if (parsed.data.actor) params.actor_username = `ilike.${parsed.data.actor}`;

  const rows = await selectRows<{
    id: string;
    actor_id: string;
    actor_username: string | null;
    actor_tier: string | null;
    action: string;
    target_type: string | null;
    target_id: string | null;
    target_label: string | null;
    details: Record<string, unknown>;
    created_at: string;
  }>("admin_audit_log", params);

  return res.status(200).json({
    entries: rows.map((row) => ({
      id: row.id,
      actorId: row.actor_id,
      actorUsername: row.actor_username,
      actorTier: row.actor_tier,
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      targetLabel: row.target_label,
      details: row.details,
      createdAt: row.created_at,
    })),
  });
});
