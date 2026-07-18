import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();

vi.mock("./stats.service.js", () => ({
  statsService: { get: getMock },
}));

const { statsRouter } = await import("./stats.routes.js");
const app = new OpenAPIHono().route("/api/stats", statsRouter);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/stats", () => {
  it("returns the aggregate stats envelope", async () => {
    getMock.mockResolvedValueOnce({ companies: 12, locations: 5, activeJobs: 340 });

    const res = await app.request("/api/stats");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ companies: 12, locations: 5, activeJobs: 340 });
  });
});
