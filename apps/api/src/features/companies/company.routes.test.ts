import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Contract-level tests for companiesRouter over HTTP. companyService is the
// handler's collaborator and the only mocked seam.

const listMock = vi.fn();
const enqueueScrapeMock = vi.fn();

vi.mock("./company.service.js", () => ({
  companyService: {
    list: listMock,
    enqueueScrape: enqueueScrapeMock,
  },
}));

const { companiesRouter } = await import("./company.routes.js");
const app = new OpenAPIHono().route("/api/companies", companiesRouter);

function postScrape(body: unknown) {
  return app.request("/api/companies/scrape", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  listMock.mockResolvedValue([]);
  enqueueScrapeMock.mockResolvedValue(undefined);
});

describe("GET /api/companies", () => {
  it("returns the company list", async () => {
    listMock.mockResolvedValueOnce([{ id: "c1", name: "Acme", slug: "acme" }]);
    const res = await app.request("/api/companies");
    expect(res.status).toBe(200);
    expect((await res.json())[0].name).toBe("Acme");
  });
});

describe("POST /api/companies/scrape", () => {
  it("enqueues valid URLs and returns 202", async () => {
    const res = await postScrape({ urls: ["https://acme.com", "https://globex.com"] });

    expect(res.status).toBe(202);
    expect(enqueueScrapeMock).toHaveBeenCalledWith(["https://acme.com", "https://globex.com"]);
  });

  it("rejects an empty URL list with 400 (min 1)", async () => {
    const res = await postScrape({ urls: [] });

    expect(res.status).toBe(400);
    expect(enqueueScrapeMock).not.toHaveBeenCalled();
  });

  it("rejects a non-URL entry with 400", async () => {
    const res = await postScrape({ urls: ["not-a-url"] });

    expect(res.status).toBe(400);
    expect(enqueueScrapeMock).not.toHaveBeenCalled();
  });
});
