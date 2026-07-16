import { beforeEach, describe, expect, it, vi } from "vitest";

const findAllEnrichedMock = vi.fn();
const findByIdEnrichedMock = vi.fn();
const findAllWithLatestRunMock = vi.fn();
const findAllActiveNotScrapedTodayMock = vi.fn();
const sendMock = vi.fn();

// job.service's direct collaborators are the @repo/db repos and the Inngest
// client. Mock both seams and assert job.service's own behavior: the
// limit+1/hasMore slicing, the display DTO mapping, and the enqueue fan-out
// branching. Drizzle query building itself is @repo/db's concern.
vi.mock("@repo/db", () => ({
  jobRepo: {
    findAllEnriched: findAllEnrichedMock,
    findByIdEnriched: findByIdEnrichedMock,
  },
  jobSourceRepo: {
    findAllWithLatestRun: findAllWithLatestRunMock,
    findAllActiveNotScrapedToday: findAllActiveNotScrapedTodayMock,
  },
}));

vi.mock("inngest", () => ({
  Inngest: vi.fn().mockImplementation(() => ({ send: sendMock })),
}));

const { jobService } = await import("./job.service.js");

function makeJobRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "job-1",
    title: "Software Engineer",
    companyName: "Acme",
    sourceUrl: "https://example.com/jobs/1",
    locationRaw: "Jakarta",
    experienceLevel: "mid",
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    salaryPeriod: null,
    description: null,
    requirements: null,
    benefits: null,
    postedAt: null,
    company: null,
    category: null,
    workArrangement: null,
    employmentType: null,
    province: null,
    district: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("jobService.list", () => {
  it("reports hasMore=true and slices to the requested limit when the repo over-fetches", async () => {
    findAllEnrichedMock.mockResolvedValueOnce([makeJobRow(), makeJobRow(), makeJobRow()]);

    const result = await jobService.list({ limit: 2 });

    expect(result.hasMore).toBe(true);
    expect(result.items).toHaveLength(2);
  });

  it("reports hasMore=false when the repo returns exactly the limit", async () => {
    findAllEnrichedMock.mockResolvedValueOnce([makeJobRow(), makeJobRow()]);

    const result = await jobService.list({ limit: 2 });

    expect(result.hasMore).toBe(false);
    expect(result.items).toHaveLength(2);
  });

  it("returns an empty list with hasMore=false when there are no rows", async () => {
    findAllEnrichedMock.mockResolvedValueOnce([]);

    const result = await jobService.list({ limit: 20 });

    expect(result).toEqual({ items: [], hasMore: false });
  });

  it("composes locationLabel from district + province when both are present", async () => {
    findAllEnrichedMock.mockResolvedValueOnce([
      makeJobRow({ province: { name: "Jawa Barat" }, district: { name: "Bandung" } }),
    ]);

    const result = await jobService.list({});

    expect(result.items[0].locationLabel).toBe("Bandung, Jawa Barat");
  });

  it("falls back to province name alone when there is no district", async () => {
    findAllEnrichedMock.mockResolvedValueOnce([makeJobRow({ province: { name: "Jawa Barat" } })]);

    const result = await jobService.list({});

    expect(result.items[0].locationLabel).toBe("Jawa Barat");
  });

  it("falls back to the raw scraped location when there is no province or district", async () => {
    findAllEnrichedMock.mockResolvedValueOnce([makeJobRow({ locationRaw: "Somewhere, ID" })]);

    const result = await jobService.list({});

    expect(result.items[0].locationLabel).toBe("Somewhere, ID");
  });

  it("returns a null locationLabel when there is no province, district, or raw location", async () => {
    findAllEnrichedMock.mockResolvedValueOnce([makeJobRow({ locationRaw: null })]);

    const result = await jobService.list({});

    expect(result.items[0].locationLabel).toBeNull();
  });

  it("nullish-coalesces absent relations to null in the DTO", async () => {
    findAllEnrichedMock.mockResolvedValueOnce([makeJobRow()]);

    const result = await jobService.list({});

    expect(result.items[0]).toMatchObject({
      companyLogoUrl: null,
      categoryName: null,
      workArrangementName: null,
      employmentTypeName: null,
    });
  });
});

describe("jobService.getDetail", () => {
  it("returns null when the job doesn't exist", async () => {
    findByIdEnrichedMock.mockResolvedValueOnce(null);

    expect(await jobService.getDetail("missing")).toBeNull();
  });

  it("returns the mapped DTO when the job exists", async () => {
    findByIdEnrichedMock.mockResolvedValueOnce(makeJobRow({ id: "job-42" }));

    const result = await jobService.getDetail("job-42");

    expect(result?.id).toBe("job-42");
  });
});

describe("jobService.enqueueScrape", () => {
  it("fans out to every active source not scraped today when no jobSourceId is given", async () => {
    findAllActiveNotScrapedTodayMock.mockResolvedValueOnce([
      { id: "source-1" },
      { id: "source-2" },
    ]);

    await jobService.enqueueScrape();

    expect(findAllActiveNotScrapedTodayMock).toHaveBeenCalledOnce();
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sendMock).toHaveBeenCalledWith({
      name: "job/scrape.requested",
      data: { jobSourceId: "source-1" },
    });
    expect(sendMock).toHaveBeenCalledWith({
      name: "job/scrape.requested",
      data: { jobSourceId: "source-2" },
    });
  });

  it("sends exactly one event and skips the fan-out lookup when a jobSourceId is given", async () => {
    await jobService.enqueueScrape("source-99");

    expect(findAllActiveNotScrapedTodayMock).not.toHaveBeenCalled();
    expect(sendMock).toHaveBeenCalledOnce();
    expect(sendMock).toHaveBeenCalledWith({
      name: "job/scrape.requested",
      data: { jobSourceId: "source-99" },
    });
  });
});
