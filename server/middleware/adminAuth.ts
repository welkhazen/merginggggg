import type { NextFunction, Request, Response } from "express";
import type { StaffTier } from "../lib/roles.js";
import { resolveTier, tierAtLeast } from "../lib/roles.js";
import type { AdminSession } from "../lib/sessionToken.js";
import { SESSION_COOKIE, verifySessionToken } from "../lib/sessionToken.js";
import { selectRows } from "../lib/supabaseAdmin.js";

export function getAdminSession(req: Request): AdminSession | null {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies ?? {};
  return verifySessionToken(cookies[SESSION_COOKIE]);
}

// The cookie only proves identity; tier and status are re-read from the
// database so bans and demotions apply immediately, not at cookie expiry.
// The fresh session is cached on res.locals because chained tier gates can
// run several times for one request.
async function loadFreshSession(req: Request, res: Response): Promise<AdminSession | null> {
  const cached = res.locals.freshAdminSession as AdminSession | null | undefined;
  if (cached !== undefined) return cached;

  const cookieSession = getAdminSession(req);
  if (!cookieSession) {
    res.locals.freshAdminSession = null;
    return null;
  }

  const rows = await selectRows<{ id: string; username: string; role: string; status: string; staff_tier: string | null }>(
    "users",
    { select: "id,username,role,status,staff_tier", id: `eq.${cookieSession.userId}`, limit: 1 },
  );
  const user = rows[0];
  const tier = user ? resolveTier(user) : null;
  const fresh: AdminSession | null =
    !user || user.status === "banned" || !tier
      ? null
      : { userId: user.id, username: user.username, role: user.role, tier, exp: cookieSession.exp };

  res.locals.freshAdminSession = fresh;
  return fresh;
}

export function requireTier(minimum: StaffTier) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await loadFreshSession(req, res);
      if (!session) {
        return res.status(401).json({ error: "Authentication required." });
      }
      if (!tierAtLeast(session.tier, minimum)) {
        return res.status(403).json({ error: "Insufficient permissions." });
      }
      res.locals.adminSession = session;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export function adminSession(res: Response): AdminSession {
  return res.locals.adminSession as AdminSession;
}
