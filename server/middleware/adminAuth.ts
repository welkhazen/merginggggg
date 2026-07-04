import type { NextFunction, Request, Response } from "express";
import type { StaffTier } from "../lib/roles";
import { tierAtLeast } from "../lib/roles";
import type { AdminSession } from "../lib/sessionToken";
import { SESSION_COOKIE, verifySessionToken } from "../lib/sessionToken";

export function getAdminSession(req: Request): AdminSession | null {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies ?? {};
  return verifySessionToken(cookies[SESSION_COOKIE]);
}

export function requireTier(minimum: StaffTier) {
  return (req: Request, res: Response, next: NextFunction) => {
    const session = getAdminSession(req);
    if (!session) {
      return res.status(401).json({ error: "Authentication required." });
    }
    if (!tierAtLeast(session.tier, minimum)) {
      return res.status(403).json({ error: "Insufficient permissions." });
    }
    res.locals.adminSession = session;
    return next();
  };
}

export function adminSession(res: Response): AdminSession {
  return res.locals.adminSession as AdminSession;
}
