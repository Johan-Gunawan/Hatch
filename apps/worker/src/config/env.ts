import { z } from "zod";

const envSchema = z.object({
  // IANA timezone used for any local-calendar-day bucketing (e.g. analytics rollups).
  TIMEZONE: z.string().default("Asia/Jakarta"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("env-validation-failed", JSON.stringify(parsed.error.flatten().fieldErrors));
  throw new Error("Invalid worker environment configuration");
}

export const env = {
  timezone: parsed.data.TIMEZONE,
};

console.log("env-loaded", JSON.stringify(env));
