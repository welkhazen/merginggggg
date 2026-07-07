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
    z.string().min(32, "SESSION_SECRET must be at least 32 characters.").default("dev-session-secret-change-me-32chars")
  ),
  SUPABASE_URL: z.preprocess((value) => ensureUrlProtocol(value) ?? "", z.union([z.string().url(), z.literal("")])),
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess((value) => emptyToUndefined(value) ?? "", z.union([z.string().min(30), z.literal("")])),
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

if (
  parsedEnv.success &&
  parsedEnv.data.NODE_ENV === "production" &&
  parsedEnv.data.SESSION_SECRET === DEV_SESSION_SECRET
) {
  const serviceRoleKey = parsedEnv.data.SUPABASE_SERVICE_ROLE_KEY;
  const hasUsableServiceKey = serviceRoleKey.length >= 30 && serviceRoleKey !== PLACEHOLDER_SERVICE_ROLE_KEY;
  if (hasUsableServiceKey) {
    // No explicit SESSION_SECRET was set, but a real service role key is
    // present: derive a stable secret from it so the app boots and sessions
    // work out of the box, rather than refusing to start over a missing var.
    parsedEnv.data.SESSION_SECRET = deriveSessionSecret(serviceRoleKey);
    console.warn("[startup] SESSION_SECRET not set; deriving a stable secret from SUPABASE_SERVICE_ROLE_KEY.");
  } else {
    // Nothing usable to derive from — surface it so /api/health can report it.
    configErrors.push("SESSION_SECRET");
    console.error("[startup] SESSION_SECRET must be set to a unique value in production.");
  }
}

// Placeholders keep importing modules loadable when config is broken; the
// /api gate in server/index.ts rejects requests before these are ever used.
// This MUST never throw: a throw at import time crashes the whole serverless
// function into an opaque FUNCTION_INVOCATION_FAILED, which is exactly the
// failure mode this module exists to prevent. So we try the real env first,
// then fall back to a minimal input that cannot fail validation.
type Env = z.infer<typeof envSchema>;

const PLACEHOLDER_REQUIRED = {
  SUPABASE_URL: "https://unconfigured.invalid",
  SUPABASE_SERVICE_ROLE_KEY: PLACEHOLDER_SERVICE_ROLE_KEY,
};

function fallbackEnv(): Env {
  // Preserve whatever the operator DID set correctly (e.g. NODE_ENV,
  // API_PORT, CORS_ORIGIN) by dropping only the fields that failed.
  const cleaned: Record<string, unknown> = { ...process.env, ...PLACEHOLDER_REQUIRED };
  for (const field of configErrors) {
    if (!(field in PLACEHOLDER_REQUIRED)) delete cleaned[field];
  }
  const withKept = envSchema.safeParse(cleaned);
  if (withKept.success) return withKept.data;

  // Some other var is malformed too. Retry with the bare minimum, keeping only
  // NODE_ENV so production still behaves like production. This input is fully
  // controlled and always valid.
  const minimal = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test" ? process.env.NODE_ENV : "development",
    ...PLACEHOLDER_REQUIRED,
  });
  if (minimal.success) {
    for (const field of Object.keys(withKept.error.flatten().fieldErrors)) {
      if (!configErrors.includes(field)) configErrors.push(field);
    }
    return minimal.data;
  }

  // Unreachable in practice; keeps the type honest without a throw.
  configErrors.push("ENV");
  return {
    NODE_ENV: "production",
    API_PORT: 8787,
    CORS_ORIGIN: "http://localhost:8080",
    SESSION_SECRET: DEV_SESSION_SECRET,
    CRASH_ALERT_APP_NAME: "raW",
    ...PLACEHOLDER_REQUIRED,
  } as Env;
}

export const env: Env = parsedEnv.success ? parsedEnv.data : fallbackEnv();
