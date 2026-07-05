import { createHmac, timingSafeEqual } from "node:crypto";
import type { Response } from "express";
import { env } from "../config/env";
import type { StaffTier } from "./roles";
import { isStaffTier } from "./roles";

// Stateless HMAC-signed session so auth works on serverless (no shared
// session store between invocations). Same cookie semantics as the previous
// express-session setup.
export const SESSION_COOKIE = "raw.sid";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export type AdminSession = {
  userId: string;
  username: string;
  role: string;
  tier: StaffTier;
  exp: number;
};

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", env.SESSION_SECRET).update(payload).digest("base64url");
}

export function createSessionToken(session: Omit<AdminSession, "exp">): string {
  const payload = base64url(JSON.stringify({ ...session, exp: Date.now() + SESSION_TTL_MS }));
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): AdminSession | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<AdminSession>;
    if (
      typeof parsed.userId !== "string" ||
      typeof parsed.username !== "string" ||
      typeof parsed.role !== "string" ||
      !isStaffTier(parsed.tier) ||
      typeof parsed.exp !== "number" ||
      parsed.exp < Date.now()
    ) {
      return null;
    }
    return parsed as AdminSession;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, session: Omit<AdminSession, "exp">): void {
  res.cookie(SESSION_COOKIE, createSessionToken(session), {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}
