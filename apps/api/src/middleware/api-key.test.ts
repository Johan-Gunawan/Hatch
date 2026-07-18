import { Hono } from "hono";
import { beforeAll, describe, expect, it } from "vitest";

// env.js reads these once at import, so they must be set before apiKeyGuard is
// imported below. A tiny app applies the guard to a dummy route so we test the
// guard in isolation (no routers / DB pulled in).
process.env.NODE_ENV = "test";
process.env.API_KEYS = "test-key";
process.env.ADMIN_API_KEYS = "admin-key";

let app: Hono;

beforeAll(async () => {
  const { apiKeyGuard } = await import("./api-key.js");
  app = new Hono();
  app.use("/api/*", apiKeyGuard);
  app.get("/api/ping", (c) => c.json({ ok: true }));
});

describe("apiKeyGuard", () => {
  it("rejects a request with no x-api-key (401)", async () => {
    const res = await app.request("/api/ping");
    expect(res.status).toBe(401);
  });

  it("rejects a request with a wrong x-api-key (401)", async () => {
    const res = await app.request("/api/ping", { headers: { "x-api-key": "nope" } });
    expect(res.status).toBe(401);
  });

  it("accepts a request with a valid API key (200)", async () => {
    const res = await app.request("/api/ping", { headers: { "x-api-key": "test-key" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("accepts a request with a valid admin key (200)", async () => {
    const res = await app.request("/api/ping", { headers: { "x-api-key": "admin-key" } });
    expect(res.status).toBe(200);
  });
});
