import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";
import { rateLimiter } from "hono-rate-limiter";
import { env } from "../config/env.js";
import { matchesAnyKey } from "../utils/match-key.js";

// Reads the key straight off the request rather than depending on
// apiKeyGuard having run first — this middleware stays registered ahead of
// apiKeyGuard in index.ts on purpose, so unauthenticated/invalid-key
// requests are still throttled instead of bypassing the limiter entirely.
function isAdminRequest(c: Context): boolean {
  const provided = c.req.header("x-api-key");
  return Boolean(provided) && matchesAnyKey(provided as string, env.adminApiKeys);
}

// In-memory limiter keyed by client IP. Resets on restart and is per-process,
// which is acceptable for the current single-instance node-server.
export const rateLimitMiddleware = rateLimiter({
  windowMs: env.rateLimit.windowMs,
  limit: env.rateLimit.max,
  standardHeaders: "draft-7",
  skip: isAdminRequest,
  keyGenerator: (c: Context) => {
    const ip = getConnInfo(c).remote.address ?? c.req.header("x-forwarded-for") ?? "unknown";
    return ip;
  },
  handler: (c) => {
    console.log("rate-limit-exceeded", JSON.stringify({ path: c.req.path }));
    return c.json({ error: "Too many requests" }, 429);
  },
});

// Tighter limiter for /track/* — this path has no API-key gate (it's called
// from the browser via the web app's same-origin proxy), so it leans on a
// stricter per-IP throttle instead.
export const trackingRateLimitMiddleware = rateLimiter({
  windowMs: env.trackingRateLimit.windowMs,
  limit: env.trackingRateLimit.max,
  standardHeaders: "draft-7",
  keyGenerator: (c: Context) => {
    const ip = getConnInfo(c).remote.address ?? c.req.header("x-forwarded-for") ?? "unknown";
    return ip;
  },
  handler: (c) => {
    console.log("tracking-rate-limit-exceeded", JSON.stringify({ path: c.req.path }));
    return c.json({ error: "Too many requests" }, 429);
  },
});
