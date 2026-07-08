import { createHash } from "node:crypto";
import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv({ path: ".env.local" });
loadEnv();

// Well-known dev default. It lives in source, so signing production session
// cookies with it would let anyone forge a session — it must never be used
// outside development.
const DEV_SESSION_SECRET = "dev-session-secret-change-me-32chars";
const PLACEHOLDER_SERVICE_ROLE_KEY = "unconfigured-placeholder-service-role-key";

// Deterministically derive a stable 256-bit signing secret from an already-set,
// server-only high-entropy secret (the Supabase service role key). Every
// serverless instance derives the identical value, so HMAC-signed session
// cookies verify across cold starts and concurrent instances with no shared
// store — and the secret is only as exposed as the service role key itself,
// which is already the app's most privileged credential.
const deriveSessionSecret = (source: string) =>
  createHash("sha256").update(`raw-session-secret:${source}`).digest("hex");

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const ensureUrlProtocol = (value: unknown) => {
  const cleaned = emptyToUndefined(value);
  if (typeof cleaned !== "string") return cleaned;
  return /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
};

const DEFAULT_SESSION_SECRET = "dev-session-secret-change-me-32chars";

function deriveProductionSessionSecret(serviceRoleKey: string) {
  return createHash("sha256").update(`raw-admin-session:${serviceRoleKey}`).digest("hex");
}

const serverEnv = {
  ...process.env,
  SUPABASE_URL:
    emptyToUndefined(process.env.SUPABASE_URL) ??
    emptyToUndefined(process.env.NEXT_PUBLIC_SUPABASE_URL) ??
    emptyToUndefined(process.env.VITE_SUPABASE_URL) ??
    emptyToUndefined(process.env.VITE_PUBLIC_SUPABASE_URL),
  SUPABASE_SERVICE_ROLE_KEY:
    emptyToUndefined(process.env.SUPABASE_SERVICE_ROLE_KEY) ??
    emptyToUndefined(process.env.SUPABASE_SERVICE_KEY) ??
    emptyToUndefined(process.env.SUPABASE_SECRET_KEY),
};

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(8787),
  CORS_ORIGIN: z.string().url().default("http://localhost:8080"),
  SESSION_SECRET: z.preprocess(
    emptyToUndefined,
    z.string().min(32, "SESSION_SECRET must be at least 32 characters.").default(DEFAULT_SESSION_SECRET)
  ),
  SUPABASE_URL: z.preprocess(ensureUrlProtocol, z.string().url().optional()).default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(emptyToUndefined, z.string().min(30).optional()).default(""),
  POSTHOG_PROJECT_API_KEY: z.preprocess(emptyToUndefined, z.string().min(20).optional()),
  POSTHOG_HOST: z.preprocess(ensureUrlProtocol, z.string().url().optional()),
  // Crash alert emails (System & Errors tab). Optional: alerts are skipped when unset.
  RESEND_API_KEY: z.preprocess(emptyToUndefined, z.string().min(10).optional()),
  CRASH_ALERT_FROM: z.preprocess(emptyToUndefined, z.string().optional()),
  CRASH_ALERT_TO: z.preprocess(emptyToUndefined, z.string().optional()),
  CRASH_ALERT_APP_NAME: z.preprocess(emptyToUndefined, z.string().default("raW")),
  // Vercel REST API (System tab deployments/errors). Optional.
  VERCEL_TOKEN: z.preprocess(emptyToUndefined, z.string().optional()),
  VERCEL_TEAM_ID: z.preprocess(emptyToUndefined, z.string().optional()),
  VERCEL_PROJECT_ID: z.preprocess(emptyToUndefined, z.string().optional()),
  // Supabase Management API personal access token (System tab logs/advisors). Optional.
  SUPABASE_MGMT_TOKEN: z.preprocess(emptyToUndefined, z.string().optional()),
  SUPABASE_PROJECT_REF: z.preprocess(emptyToUndefined, z.string().optional()),
  // PostHog private Query API (Analytics tab). Optional.
  POSTHOG_PERSONAL_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  POSTHOG_PROJECT_ID: z.preprocess(emptyToUndefined, z.string().optional()),
});

const parsedEnv = envSchema.safeParse(serverEnv);

// On serverless a process.exit here surfaces as an opaque crashed function.
// Instead we record which variables are broken and keep the app booting, so
// /api/health can report the misconfiguration and other routes can refuse
// requests with a clear error. Variable names only — never values.
export const configErrors: string[] = [];

if (!parsedEnv.success) {
  console.error("[startup] Invalid environment configuration", parsedEnv.error.flatten().fieldErrors);
}

if (parsedEnv.success && parsedEnv.data.NODE_ENV === "production" && parsedEnv.data.SESSION_SECRET === DEFAULT_SESSION_SECRET) {
  if (parsedEnv.data.SUPABASE_SERVICE_ROLE_KEY) {
    parsedEnv.data.SESSION_SECRET = deriveProductionSessionSecret(parsedEnv.data.SUPABASE_SERVICE_ROLE_KEY);
    console.warn(
      "[startup] SESSION_SECRET is not set; deriving a stable production session secret from SUPABASE_SERVICE_ROLE_KEY. " +
        "Set a dedicated SESSION_SECRET in Vercel for cleaner key rotation.",
    );
  } else {
    console.warn("[startup] SESSION_SECRET is not set; using the development secret until Supabase env vars are configured.");
  }
}

export const env = parsedEnv.success
  ? parsedEnv.data
  : {
      NODE_ENV: "development" as const,
      API_PORT: 8787,
      CORS_ORIGIN: "http://localhost:8080",
      SESSION_SECRET: DEFAULT_SESSION_SECRET,
      SUPABASE_URL: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      CRASH_ALERT_APP_NAME: "raW",
    };
export const isSupabaseConfigured = Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
