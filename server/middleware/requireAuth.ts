import type { NextFunction, Request, Response } from "express";
import { findUserById } from "../lib/store";
import type { AuthSessionData } from "../types";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionData = req.session as unknown as AuthSessionData;
  if (!sessionData.userId) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const user = findUserById(sessionData.userId);
  if (!user) {
    return res.status(401).json({ error: "Authentication required." });
  }

  return next();
}
