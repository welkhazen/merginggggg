import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv({ path: ".env.local" });
loadEnv();

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(8787),
  CORS_ORIGIN: z.string().url().default("http://localhost:8080"),
  SESSION_SECRET: z.preprocess(
    emptyToUndefined,
    z.string().min(32, "SESSION_SECRET must be at least 32 characters.").default("dev-session-secret-change-me-32chars")
  ),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(30),
  POSTHOG_PROJECT_API_KEY: z.preprocess(emptyToUndefined, z.string().min(20).optional()),
  POSTHOG_HOST: z.preprocess(emptyToUndefined, z.string().url().optional()),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("[startup] Invalid environment configuration", parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

if (
  parsedEnv.data.NODE_ENV === "production" &&
  parsedEnv.data.SESSION_SECRET === "dev-session-secret-change-me-32chars"
) {
  console.error("[startup] SESSION_SECRET must be set to a unique value in production.");
  process.exit(1);
}

export const env = parsedEnv.data;
