import { createHash } from "node:crypto";
import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv({ path: ".env.local" });
loadEnv();

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

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("[startup] Invalid environment configuration", parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

if (parsedEnv.data.NODE_ENV === "production" && parsedEnv.data.SESSION_SECRET === DEFAULT_SESSION_SECRET) {
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

export const env = parsedEnv.data;
export const isSupabaseConfigured = Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
