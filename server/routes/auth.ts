import type { Request } from "express";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { rpc, selectRows } from "../lib/supabaseAdmin";
import type { AuthSessionData } from "../types";

type DbUser = {
  id: string;
  username: string;
  role: "admin" | "moderator" | "member" | "user";
  status: string;
};

const loginSchema = z.object({
  username: z.string().trim().min(3).max(24),
  password: z.string().min(6).max(128),
});

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again later." },
});

function getSessionData(req: Request): AuthSessionData {
  return req.session as unknown as AuthSessionData;
}

async function regenerateSession(session: { regenerate: (callback: (err: unknown) => void) => void }): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    session.regenerate((err: unknown) => (err ? reject(err) : resolve()));
  });
}

function toAuthUser(user: DbUser) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    status: user.status,
  };
}

async function findUserById(id: string) {
  const rows = await selectRows<DbUser>("users", {
    select: "id,username,role,status",
    id: `eq.${id}`,
    limit: 1,
  });
  return rows[0] ?? null;
}

export const authRouter = Router();

authRouter.post("/login", loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const userId = await rpc<string | null>("verify_user_password", {
    p_username: parsed.data.username,
    p_password: parsed.data.password,
  });

  if (!userId) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const user = await findUserById(userId);
  if (!user || user.status === "banned" || (user.role !== "admin" && user.role !== "moderator")) {
    return res.status(403).json({ error: "Admin access only." });
  }

  await regenerateSession(req.session);
  const sessionData = getSessionData(req);
  sessionData.userId = user.id;
  sessionData.username = user.username;
  sessionData.role = user.role;

  return res.status(200).json({ ok: true, user: toAuthUser(user) });
});

authRouter.get("/me", async (req, res) => {
  const sessionData = getSessionData(req);
  if (!sessionData.userId) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  const user = await findUserById(sessionData.userId);
  if (!user || user.status === "banned" || (user.role !== "admin" && user.role !== "moderator")) {
    sessionData.userId = undefined;
    return res.status(401).json({ error: "Not authenticated." });
  }

  sessionData.username = user.username;
  sessionData.role = user.role;
  return res.status(200).json({ ok: true, user: toAuthUser(user) });
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Logout failed." });
    res.clearCookie("raw.sid");
    return res.status(200).json({ ok: true });
  });
});
