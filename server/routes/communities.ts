import { Router } from "express";
import { z } from "zod";
import { insertRow, selectRows } from "../lib/supabaseAdmin.js";

type CommunityRow = {
  id: string;
  abbr: string | null;
  title: string;
  topic: string | null;
  status: string | null;
  locked: boolean | null;
  created_at: string;
};

const communityWaitlistSchema = z.object({
  contact: z.string().trim().min(1).max(120),
  communityId: z.string().trim().min(1).max(120),
  communityTitle: z.string().trim().min(1).max(160).optional(),
  note: z.string().trim().max(240).optional(),
});

function toLockedCommunity(community: CommunityRow) {
  return {
    id: community.id,
    abbr: community.abbr,
    title: community.title,
    topic: community.topic,
    status: "Waitlist",
    locked: true,
    createdAt: community.created_at,
    waitlistEndpoint: "/api/communities/waitlist",
  };
}

export const communitiesPublicRouter = Router();

communitiesPublicRouter.get("/", async (_req, res) => {
  const rows = await selectRows<CommunityRow>("communities", {
    select: "id,abbr,title,topic,status,locked,created_at",
    order: "created_at.asc",
  });

  return res.status(200).json({ communities: rows.map(toLockedCommunity) });
});

communitiesPublicRouter.post("/waitlist", async (req, res) => {
  const parsed = communityWaitlistSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_payload" });

  const communityRows = await selectRows<Pick<CommunityRow, "id" | "title">>("communities", {
    select: "id,title",
    id: `eq.${parsed.data.communityId}`,
    limit: 1,
  });
  const community = communityRows[0];
  if (!community) return res.status(404).json({ error: "community_not_found" });

  const title = parsed.data.communityTitle || community.title;
  const noteParts = [`Community room: ${title} (${community.id})`];
  if (parsed.data.note) noteParts.push(parsed.data.note);

  await insertRow("invite_waitlist_requests", {
    contact: parsed.data.contact,
    note: noteParts.join("\n\n").slice(0, 240),
    source: `community:${community.id}`.slice(0, 60),
  });

  return res.status(200).json({ ok: true });
});
