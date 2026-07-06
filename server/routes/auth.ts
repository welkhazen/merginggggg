import { Router } from "express";
import rateLimit from "express-rate-limit";
import type { Response } from "express";
import { z } from "zod";
import { captureServerEvent, getPostHogDistinctId } from "../lib/analytics";
import type { StaffTier } from "../lib/roles";
import { resolveTier } from "../lib/roles";
import { clearSessionCookie, setSessionCookie } from "../lib/sessionToken";
import { SupabaseAdminError, rpc, selectRows } from "../lib/supabaseAdmin";
import { getAdminSession } from "../middleware/adminAuth";

type DbUser = {
  id: string;
  username: string;
  role: string;
  status: string;
  staff_tier: string | null;
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

function toAuthUser(user: DbUser, tier: StaffTier) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    tier,
    status: user.status,
  };
}

function handleAuthServiceError(action: string, error: unknown, res: Response) {
  console.error(`[auth] ${action} failed`, error);

  if (error instanceof SupabaseAdminError) {
    if (error.status === 401 || error.status === 403) {
      return res.status(503).json({ error: "Authentication service is not configured." });
    }

    if (error.status === 404) {
      return res.status(503).json({ error: "Authentication service is missing required database setup." });
    }
  }

  return res.status(503).json({ error: "Authentication service is temporarily unavailable." });
}

async function findUserById(id: string) {
  const rows = await selectRows<DbUser>("users", {
    select: "id,username,role,status,staff_tier",
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

  try {
    const userId = await rpc<string | null>("verify_user_password", {
      p_username: parsed.data.username,
      p_password: parsed.data.password,
    });

    if (!userId) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const user = await findUserById(userId);
    const tier = user ? resolveTier(user) : null;
    if (!user || user.status === "banned" || !tier) {
      return res.status(403).json({ error: "Staff access only." });
    }

    setSessionCookie(res, { userId: user.id, username: user.username, role: user.role, tier });

    captureServerEvent(req, "admin_signed_in_server", getPostHogDistinctId(req, user.id), { role: user.role, tier });
    return res.status(200).json({ ok: true, user: toAuthUser(user, tier) });
  } catch (error) {
    return handleAuthServiceError("login", error, res);
  }
});

authRouter.get("/me", async (req, res) => {
  const session = getAdminSession(req);
  if (!session) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  try {
    // Re-fetch so bans and tier changes take effect on the next request.
    const user = await findUserById(session.userId);
    const tier = user ? resolveTier(user) : null;
    if (!user || user.status === "banned" || !tier) {
      clearSessionCookie(res);
      return res.status(401).json({ error: "Not authenticated." });
    }

    setSessionCookie(res, { userId: user.id, username: user.username, role: user.role, tier });
    captureServerEvent(req, "admin_session_restored_server", getPostHogDistinctId(req, user.id), { role: user.role, tier });
    return res.status(200).json({ ok: true, user: toAuthUser(user, tier) });
  } catch (error) {
    return handleAuthServiceError("session restore", error, res);
  }
});

authRouter.post("/logout", (req, res) => {
  const session = getAdminSession(req);
  if (session) {
    captureServerEvent(req, "admin_signed_out_server", getPostHogDistinctId(req, session.userId), {
      role: session.role,
      tier: session.tier,
    });
  }
  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
});
