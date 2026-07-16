import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

const envSchema = z.object({
  ADMIN_PASSWORD: z.string().min(1).optional(),
  ADMIN_SESSION_SECRET: z.string().min(16).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("web-env-validation-failed", JSON.stringify(parsed.error.flatten().fieldErrors));
  throw new Error("Invalid web environment configuration");
}

if (isProduction && !parsed.data.ADMIN_PASSWORD) {
  throw new Error("ADMIN_PASSWORD is required in production");
}

if (isProduction && !parsed.data.ADMIN_SESSION_SECRET) {
  throw new Error("ADMIN_SESSION_SECRET is required in production");
}

// In development with no values configured, fall back to known dev defaults so
// local admin login works without manual env setup, while still requiring real
// values in production.
const adminPassword = parsed.data.ADMIN_PASSWORD ?? (isProduction ? "" : "dev-admin-password");
const adminSessionSecret =
  parsed.data.ADMIN_SESSION_SECRET ??
  (isProduction ? "" : "dev-admin-session-secret-please-change");

export const env = {
  isProduction,
  adminPassword,
  adminSessionSecret,
};

console.log(
  "web-env-loaded",
  JSON.stringify({
    isProduction,
    hasAdminPassword: Boolean(adminPassword),
    hasAdminSessionSecret: Boolean(adminSessionSecret),
  })
);
