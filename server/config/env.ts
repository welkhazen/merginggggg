import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(8787),
  CORS_ORIGIN: z.string().url().default("http://localhost:8080"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters."),
  PHONE_HMAC_KEY: z.string().min(32, "PHONE_HMAC_KEY must be at least 32 characters."),
  AUTH_PASSWORD_PEPPER: z.string().min(16, "AUTH_PASSWORD_PEPPER must be at least 16 characters."),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  TWILIO_ACCOUNT_SID: z.string().regex(/^AC[a-zA-Z0-9]{32}$/, "TWILIO_ACCOUNT_SID must start with AC and be 34 characters."),
  TWILIO_AUTH_TOKEN: z.string().min(32, "TWILIO_AUTH_TOKEN must be at least 32 characters."),
  TWILIO_VERIFY_SERVICE_SID: z.string().regex(/^VA[a-zA-Z0-9]{32}$/, "TWILIO_VERIFY_SERVICE_SID must start with VA and be 34 characters."),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("[startup] Invalid environment configuration", parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsedEnv.data;
