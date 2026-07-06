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
const fallbackEnv: z.infer<typeof envSchema> = {
  NODE_ENV: "development",
  API_PORT: 8787,
  CORS_ORIGIN: "http://localhost:8080",
  SESSION_SECRET: "dev-session-secret-change-me-32chars",
  SUPABASE_URL: "",
  SUPABASE_SERVICE_ROLE_KEY: "",
  CRASH_ALERT_APP_NAME: "raW",
};

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
  parsedEnv.data.SESSION_SECRET === "dev-session-secret-change-me-32chars"
) {
  configErrors.push("SESSION_SECRET");
  console.error("[startup] SESSION_SECRET must be set to a unique value in production.");
}

export const env = parsedEnv.success ? parsedEnv.data : fallbackEnv;
