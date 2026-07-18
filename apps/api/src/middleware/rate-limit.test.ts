import { Hono } from "hono";
import { beforeAll, describe, expect, it, vi } from "vitest";

// Force a tiny limit so a few requests trip it, and set keys before env.js loads.
process.env.NODE_ENV = "test";
process.env.API_KEYS = "test-key";
process.env.ADMIN_API_KEYS = "admin-key";
process.env.RATE_LIMIT_MAX = "2";
process.env.RATE_LIMIT_WINDOW_MS = "60000";

// getConnInfo needs the node-server binding, which app.request() doesn't
// provide — stub it so the limiter falls back to the x-forwarded-for header,
// letting each test isolate its counter with a distinct IP.
vi.mock("@hono/node-server/conninfo", () => ({
  getConnInfo: () => ({ remote: { address: undefined } }),
}));

let app: Hono;

beforeAll(async () => {
  const { rateLimitMiddleware } = await import("./rate-limit.js");
  app = new Hono();
  app.use("/api/*", rateLimitMiddleware);
  app.get("/api/ping", (c) => c.json({ ok: true }));
});

function ping(ip: string, apiKey?: string) {
  const headers: Record<string, string> = { "x-forwarded-for": ip };
  if (apiKey) headers["x-api-key"] = apiKey;
  return app.request("/api/ping", { headers });
}

describe("rateLimitMiddleware", () => {
  it("throttles a client once it exceeds the limit (429)", async () => {
    const ip = "10.0.0.1";
    const first = await ping(ip);
    const second = await ping(ip);
    const third = await ping(ip);

    expect([first.status, second.status]).toEqual([200, 200]);
    expect(third.status).toBe(429);
  });

  it("exempts admin-key requests from the limiter", async () => {
    const ip = "10.0.0.2";
    const statuses = [
      (await ping(ip, "admin-key")).status,
      (await ping(ip, "admin-key")).status,
      (await ping(ip, "admin-key")).status,
    ];

    expect(statuses).toEqual([200, 200, 200]);
  });
});
