import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

const csv = (value: string) =>
  value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  // Comma-separated list of accepted API keys (supports rotation).
  API_KEYS: z
    .string()
    .optional()
    .transform((value) => (value ? csv(value) : []))
    .refine((keys) => !isProduction || keys.length > 0, {
      message: "API_KEYS must contain at least one key in production",
    }),
  // Comma-separated list of admin-only API keys. Valid for everything a
  // regular key is valid for, but also exempted from the per-IP rate limiter
  // (see middleware/rate-limit.ts) — used by the admin dashboard's
  // server-side calls so dashboard polling/actions are never throttled.
  ADMIN_API_KEYS: z
    .string()
    .optional()
    .transform((value) => (value ? csv(value) : [])),
  // Comma-separated allowlist of origins permitted by CORS.
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000")
    .transform((value) => csv(value)),
  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  TRACKING_RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 1000),
  TRACKING_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
  // Resume-matching (semantic search) dependencies. The OpenAI key is read as
  // OPENAI_API_KEY (SDK standard) or OPEN_AI_KEY (this repo's existing .env name).
  OPENAI_API_KEY: z.string().optional(),
  OPEN_AI_KEY: z.string().optional(),
  DEEPSEEK_AI: z
    .string()
    .optional()
    .refine((value) => !isProduction || !!value, {
      message: "DEEPSEEK_AI is required in production (resume parsing/rerank)",
    }),
  // Admin dashboard login password, checked server-side via timingSafeEqual
  // (see features/auth). Never exposed to apps/web.
  ADMIN_PASSWORD: z
    .string()
    .optional()
    .refine((value) => !isProduction || !!value, {
      message: "ADMIN_PASSWORD is required in production",
    }),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("env-validation-failed", JSON.stringify(parsed.error.flatten().fieldErrors));
  throw new Error("Invalid API environment configuration");
}

// In development with no key configured, fall back to a known dev key so local
// requests aren't blocked while still exercising the guard.
const apiKeys =
  parsed.data.API_KEYS.length > 0 ? parsed.data.API_KEYS : isProduction ? [] : ["dev-secret-key"];

const adminApiKeys =
  parsed.data.ADMIN_API_KEYS.length > 0
    ? parsed.data.ADMIN_API_KEYS
    : isProduction
      ? []
      : ["dev-admin-secret-key"];

const adminPassword = parsed.data.ADMIN_PASSWORD ?? (isProduction ? "" : "dev-admin-password");

export const env = {
  isProduction,
  apiKeys,
  adminApiKeys,
  adminPassword,
  openaiApiKey: parsed.data.OPENAI_API_KEY ?? parsed.data.OPEN_AI_KEY,
  deepseekApiKey: parsed.data.DEEPSEEK_AI,
  corsOrigins: parsed.data.CORS_ORIGINS,
  rateLimit: {
    windowMs: parsed.data.RATE_LIMIT_WINDOW_MS,
    max: parsed.data.RATE_LIMIT_MAX,
  },
  trackingRateLimit: {
    windowMs: parsed.data.TRACKING_RATE_LIMIT_WINDOW_MS,
    max: parsed.data.TRACKING_RATE_LIMIT_MAX,
  },
};

console.log(
  "env-loaded",
  JSON.stringify({
    isProduction,
    apiKeyCount: apiKeys.length,
    adminApiKeyCount: adminApiKeys.length,
    corsOrigins: env.corsOrigins,
    rateLimit: env.rateLimit,
    trackingRateLimit: env.trackingRateLimit,
  })
);
