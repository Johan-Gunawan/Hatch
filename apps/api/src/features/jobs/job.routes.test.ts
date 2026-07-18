import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Contract-level tests: drive the real jobsRouter over HTTP (app.request) to
// cover request validation, route resolution/ordering, and status codes. The
// handler's direct collaborator is jobService, so that's the mocked seam —
// no @repo/db or inngest is loaded.

const listMock = vi.fn();
const getFacetsMock = vi.fn();
const getDetailMock = vi.fn();
const listSourcesMock = vi.fn();
const enqueueScrapeMock = vi.fn();

vi.mock("./job.service.js", () => ({
  jobService: {
    list: listMock,
    getFacetOptions: getFacetsMock,
    getDetail: getDetailMock,
    listSources: listSourcesMock,
    enqueueScrape: enqueueScrapeMock,
  },
}));

const { jobsRouter } = await import("./job.routes.js");
const app = new OpenAPIHono().route("/api/jobs", jobsRouter);

// A syntactically valid RFC UUID (version 4, variant 8) — Zod 4 enforces the
// version/variant nibbles, so an all-ones string would fail param validation.
const VALID_UUID = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
  listMock.mockResolvedValue({ items: [], hasMore: false });
  getFacetsMock.mockResolvedValue({
    categories: [],
    workArrangements: [],
    locations: [],
    companies: [],
    salaryBound: 0,
  });
  getDetailMock.mockResolvedValue(null);
  listSourcesMock.mockResolvedValue([]);
  enqueueScrapeMock.mockResolvedValue(undefined);
});

describe("GET /api/jobs", () => {
  it("returns the { items, hasMore } envelope with default query params", async () => {
    listMock.mockResolvedValueOnce({ items: [{ id: VALID_UUID }], hasMore: true });

    const res = await app.request("/api/jobs");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [{ id: VALID_UUID }], hasMore: true });
  });
});

describe("GET /api/jobs/facets", () => {
  it("resolves to the facets handler and is not shadowed by /{id}", async () => {
    const res = await app.request("/api/jobs/facets");

    expect(res.status).toBe(200);
    expect(getFacetsMock).toHaveBeenCalledOnce();
    expect(getDetailMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/jobs/{id}", () => {
  it("rejects a non-UUID id with 400", async () => {
    const res = await app.request("/api/jobs/not-a-uuid");
    expect(res.status).toBe(400);
    expect(getDetailMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the job does not exist", async () => {
    getDetailMock.mockResolvedValueOnce(null);
    const res = await app.request(`/api/jobs/${VALID_UUID}`);
    expect(res.status).toBe(404);
  });

  it("returns 200 with the job when it exists", async () => {
    getDetailMock.mockResolvedValueOnce({ id: VALID_UUID, title: "Engineer" });
    const res = await app.request(`/api/jobs/${VALID_UUID}`);
    expect(res.status).toBe(200);
    expect((await res.json()).id).toBe(VALID_UUID);
  });
});

describe("POST /api/jobs/scrape", () => {
  it("enqueues the given source and returns 202", async () => {
    const res = await app.request("/api/jobs/scrape?jobSourceId=src-1", { method: "POST" });

    expect(res.status).toBe(202);
    expect(enqueueScrapeMock).toHaveBeenCalledWith("src-1");
  });
});
