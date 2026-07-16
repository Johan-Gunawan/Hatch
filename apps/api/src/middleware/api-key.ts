import { createMiddleware } from "hono/factory";
import { env } from "../config/env.js";
import { HTTP } from "../utils/constants.js";
import { matchesAnyKey } from "../utils/match-key.js";

// Admin keys authenticate everything a regular key does — they're just also
// exempted from the rate limiter (see middleware/rate-limit.ts).
const acceptedKeys = [...env.apiKeys, ...env.adminApiKeys];

export const apiKeyGuard = createMiddleware(async (c, next) => {
  // Preflight is handled by the CORS middleware and must never be blocked.
  if (c.req.method === "OPTIONS") {
    return next();
  }

  const provided = c.req.header("x-api-key");

  if (!provided || !matchesAnyKey(provided, acceptedKeys)) {
    console.log(
      "api-key-rejected",
      JSON.stringify({ path: c.req.path, hasKey: Boolean(provided) })
    );
    return c.json({ error: "Unauthorized" }, HTTP.UNAUTHORIZED);
  }

  return next();
});
