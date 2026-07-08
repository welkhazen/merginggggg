import { Router } from "express";
import { countRows } from "../../lib/supabaseAdmin.js";

export const statsRouter = Router();

statsRouter.get("/stats", async (_req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    totalUsers,
    bannedUsers,
    newUsers7d,
    openReports,
    unreviewedFlags,
    pendingCommunityRequests,
    pendingDonations,
    pendingTokenRequests,
    pendingWaitlist,
    pendingAppeals,
    openErrors,
    totalCommunities,
    lockedCommunities,
  ] = await Promise.all([
    countRows("users"),
    countRows("users", { status: "eq.banned" }),
    countRows("users", { created_at: `gte.${sevenDaysAgo}` }),
    countRows("chat_reports", { status: "eq.open" }),
    countRows("moderation_flags", { reviewed: "eq.false" }),
    countRows("community_requests", { status: "eq.pending" }),
    countRows("donation_interests", { status: "eq.pending" }),
    countRows("token_requests", { status: "in.(pending,new)" }),
    countRows("invite_waitlist_requests", { status: "eq.pending" }),
    countRows("appeals", { status: "eq.pending" }),
    countRows("error_events", { resolved: "eq.false" }),
    countRows("communities"),
    countRows("communities", { locked: "eq.true" }),
  ]);

  return res.status(200).json({
    stats: {
      totalUsers,
      bannedUsers,
      newUsers7d,
      openReports,
      unreviewedFlags,
      pendingCommunityRequests,
      pendingDonations,
      pendingTokenRequests,
      pendingWaitlist,
      pendingAppeals,
      openErrors,
      totalCommunities,
      lockedCommunities,
    },
  });
});
