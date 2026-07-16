import { beforeEach, describe, expect, it, vi } from "vitest";

const findAllMock = vi.fn();
const sendMock = vi.fn();

vi.mock("@repo/db", () => ({
  companyRepo: {
    findAll: findAllMock,
  },
}));

vi.mock("inngest", () => ({
  Inngest: vi.fn().mockImplementation(() => ({ send: sendMock })),
}));

const { companyService } = await import("./company.service.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("companyService.list", () => {
  it("maps repo rows to the display DTO", async () => {
    findAllMock.mockResolvedValueOnce([
      {
        id: "c1",
        name: "Acme",
        slug: "acme",
        logoUrl: "https://example.com/logo.png",
        website: "https://acme.com",
        industryId: "ignored",
      },
    ]);

    const result = await companyService.list(50);

    expect(result).toEqual([
      {
        id: "c1",
        name: "Acme",
        slug: "acme",
        logoUrl: "https://example.com/logo.png",
        website: "https://acme.com",
      },
    ]);
  });

  it("passes the limit through to the repo", async () => {
    findAllMock.mockResolvedValueOnce([]);

    await companyService.list(10);

    expect(findAllMock).toHaveBeenCalledWith({ limit: 10 });
  });

  it("returns an empty array when there are no companies", async () => {
    findAllMock.mockResolvedValueOnce([]);

    expect(await companyService.list(50)).toEqual([]);
  });
});

describe("companyService.enqueueScrape", () => {
  it("sends one company/scrape.requested event per url in a single batch call", async () => {
    await companyService.enqueueScrape(["https://a.com", "https://b.com"]);

    expect(sendMock).toHaveBeenCalledOnce();
    expect(sendMock).toHaveBeenCalledWith([
      { name: "company/scrape.requested", data: { url: "https://a.com" } },
      { name: "company/scrape.requested", data: { url: "https://b.com" } },
    ]);
  });

  it("sends an empty batch for an empty urls array", async () => {
    await companyService.enqueueScrape([]);

    expect(sendMock).toHaveBeenCalledWith([]);
  });
});
