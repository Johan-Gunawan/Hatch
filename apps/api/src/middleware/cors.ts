import { cors } from "hono/cors";
import { env } from "../config/env.js";

// Reflect only origins present in the env allowlist; other origins receive no
// Access-Control-Allow-Origin header and are blocked by the browser.
export const corsMiddleware = cors({
  origin: (origin) => (env.corsOrigins.includes(origin) ? origin : null),
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "x-api-key"],
  maxAge: 86400,
});
