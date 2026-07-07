import { Router } from "express";
import { isPostHogQueryConfigured, runHogQL } from "../../lib/posthogQuery.js";

export const analyticsRouter = Router();

analyticsRouter.get("/analytics/summary", async (_req, res) => {
  if (!isPostHogQueryConfigured) {
    return res.status(200).json({ configured: false });
  }

  const [topEvents, dailyUsers, adminActivity] = await Promise.all([
    runHogQL(
      "select event, count() as total from events where timestamp > now() - interval 7 day group by event order by total desc limit 15",
    ),
    runHogQL(
      "select toDate(timestamp) as day, count(distinct person_id) as users from events where timestamp > now() - interval 14 day group by day order by day asc",
    ),
    runHogQL(
      "select event, count() as total from events where timestamp > now() - interval 7 day and properties.app = 'standalone_admin_portal' group by event order by total desc limit 15",
    ),
  ]);

  return res.status(200).json({
    configured: true,
    topEvents,
    dailyUsers,
    adminActivity,
  });
});
