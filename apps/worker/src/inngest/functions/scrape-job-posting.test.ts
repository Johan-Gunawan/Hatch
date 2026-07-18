import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  JOB_LISTING_EXTRACTION_SYSTEM,
  JOB_POSTING_EXTRACTION_SYSTEM,
} from "../../prompts/job-posting-extraction.js";

// scrapeJob is an Inngest function whose orchestration is the unit under test.
// We mock inngest.createFunction to return the raw handler, mock every direct
// collaborator (services, fetch/clean/detect lib, the LLM seam, the embedder),
// and drive the handler with a fake `step` that runs each step body inline. The
// zod schemas (JobStub/JobDetail, parseScraperConfig) and pure prompt builders
// stay real so real validation runs. NOTE: the daily-dedup skip guard is
// currently commented out in the SUT, so it is not asserted here.

const findByIdMock = vi.fn();
const updateScraperConfigMock = vi.fn();
const touchLastScrapedAtMock = vi.fn();
const startMock = vi.fn();
const completeMock = vi.fn();
const failMock = vi.fn();
const loadLookupsMock = vi.fn();
const resolveLookupIdsMock = vi.fn();
const saveJobMock = vi.fn();
const deactivateMissingMock = vi.fn();
const setEmbeddingsMock = vi.fn();
const hybridWebsiteScrapperMock = vi.fn();
const optimizerHTMLMock = vi.fn();
const detectSiteBehaviorMock = vi.fn();
const extractNextPageLinkMock = vi.fn();
const callDeepseekJsonMock = vi.fn();
const embedBatchMock = vi.fn();

vi.mock("../client.js", () => ({
  inngest: { createFunction: (_config: unknown, _trigger: unknown, handler: unknown) => handler },
}));
vi.mock("../../services/job-source.service.js", () => ({
  findById: findByIdMock,
  updateScraperConfig: updateScraperConfigMock,
  touchLastScrapedAt: touchLastScrapedAtMock,
}));
vi.mock("../../services/scrape-run.service.js", () => ({
  start: startMock,
  complete: completeMock,
  fail: failMock,
}));
vi.mock("../../services/job.service.js", () => ({
  loadLookups: loadLookupsMock,
  resolveLookupIds: resolveLookupIdsMock,
  saveJob: saveJobMock,
  deactivateMissing: deactivateMissingMock,
  setEmbeddings: setEmbeddingsMock,
}));
vi.mock("../../lib/hybrid-website-scrapper.js", () => ({
  hybridWebsiteScrapper: hybridWebsiteScrapperMock,
}));
vi.mock("../../lib/optimizer-html.js", () => ({ optimizerHTML: optimizerHTMLMock }));
vi.mock("../../lib/detect-site-behavior.js", () => ({
  detectSiteBehavior: detectSiteBehaviorMock,
}));
vi.mock("../../lib/extract-next-page-link.js", () => ({
  extractNextPageLink: extractNextPageLinkMock,
}));
vi.mock("../../lib/llm-json.js", () => ({ callDeepseekJson: callDeepseekJsonMock }));
vi.mock("@repo/ai", () => ({ embedBatch: embedBatchMock, DEEPSEEK_MODEL: "test-model" }));

type StepRun = <T>(name: string, fn: () => T | Promise<T>) => Promise<T>;
type Handler = (args: {
  event: { data: { jobSourceId?: string } };
  step: { run: StepRun };
}) => Promise<{ processed: number; skipped?: boolean }>;

const { scrapeJob } = await import("./scrape-job-posting.js");
const handler = scrapeJob as unknown as Handler;

const step = { run: (<T>(_name: string, fn: () => T | Promise<T>) => fn()) as StepRun };

function summaryStub(overrides: Record<string, unknown> = {}) {
  return {
    title: "Software Engineer",
    sourceUrl: "https://acme.com/jobs/1",
    companyName: "Acme",
    locationRaw: "Jakarta",
    description: null,
    requirements: null,
    benefits: null,
    embeddingSummary: null,
    experienceLevel: null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    salaryPeriod: null,
    postedAt: null,
    expiresAt: null,
    employmentTypeSlug: null,
    workArrangementSlug: null,
    ...overrides,
  };
}

function detailJson(overrides: Record<string, unknown> = {}) {
  return {
    title: "Software Engineer",
    locationRaw: "Jakarta",
    description: "Do the things",
    requirements: "Know the things",
    benefits: null,
    embeddingSummary: null,
    experienceLevel: null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: "IDR",
    salaryPeriod: null,
    postedAt: null,
    expiresAt: null,
    employmentTypeSlug: null,
    workArrangementSlug: null,
    ...overrides,
  };
}

// Mutable per-test defaults returned by the LLM seam, keyed by which prompt ran.
let listingResult: unknown = [summaryStub()];
let detailResult: unknown = detailJson();

function run(jobSourceId: string | undefined = "src-1") {
  return handler({ event: { data: { jobSourceId } }, step });
}

function listingCallCount() {
  return callDeepseekJsonMock.mock.calls.filter(
    ([arg]) => (arg as { system: string }).system === JOB_LISTING_EXTRACTION_SYSTEM
  ).length;
}

beforeEach(() => {
  vi.clearAllMocks();
  listingResult = [summaryStub()];
  detailResult = detailJson();

  findByIdMock.mockResolvedValue({
    id: "src-1",
    name: "Acme",
    careerPageUrl: "https://acme.com/careers",
    scraperConfig: { maxPages: 3 },
  });
  startMock.mockResolvedValue("run-1");
  loadLookupsMock.mockResolvedValue({ employmentTypes: [], workArrangements: [] });
  resolveLookupIdsMock.mockReturnValue({});
  saveJobMock.mockResolvedValue({
    job: {
      id: "job-1",
      title: "Software Engineer",
      embeddingSummary: null,
      description: "Do the things",
      requirements: "Know the things",
    },
    wasInserted: true,
    contentChanged: true,
  });
  deactivateMissingMock.mockResolvedValue(0);
  setEmbeddingsMock.mockResolvedValue(undefined);
  embedBatchMock.mockResolvedValue([[0.1, 0.2]]);
  hybridWebsiteScrapperMock.mockResolvedValue("<html></html>");
  optimizerHTMLMock.mockReturnValue({ cleanText: "clean", links: [] });
  detectSiteBehaviorMock.mockReturnValue({ requiresJsRender: false, loadMoreSelector: null });
  extractNextPageLinkMock.mockReturnValue(null);
  callDeepseekJsonMock.mockImplementation(async ({ system }: { system: string }) => {
    if (system === JOB_LISTING_EXTRACTION_SYSTEM) return listingResult;
    if (system === JOB_POSTING_EXTRACTION_SYSTEM) return detailResult;
    return null;
  });
});

describe("scrapeJob guards", () => {
  it("throws and never starts a run when jobSourceId is missing", async () => {
    await expect(handler({ event: { data: {} }, step })).rejects.toThrow("jobSourceId is required");
    expect(startMock).not.toHaveBeenCalled();
  });

  it("throws and never starts a run when the job source is not found", async () => {
    findByIdMock.mockResolvedValueOnce(null);
    await expect(run()).rejects.toThrow("Job source not found");
    expect(startMock).not.toHaveBeenCalled();
  });
});

describe("scrapeJob happy path", () => {
  it("fetches the detail page for a summary stub, saves it, and completes the run", async () => {
    const result = await run();

    // listing fetch + detail fetch = 2 hybrid scrapes
    expect(hybridWebsiteScrapperMock).toHaveBeenCalledTimes(2);
    expect(saveJobMock).toHaveBeenCalledOnce();
    expect(completeMock).toHaveBeenCalledWith("run-1", {
      jobsFound: 1,
      jobsInserted: 1,
      jobsUpdated: 0,
      jobsDeactivated: 0,
    });
    expect(touchLastScrapedAtMock).toHaveBeenCalledWith("src-1");
    expect(result).toEqual({ processed: 1 });
  });

  it("uses listing data directly for a rich stub and skips the detail fetch", async () => {
    listingResult = [summaryStub({ description: "Full JD inline", requirements: "Inline reqs" })];

    const result = await run();

    // only the listing page is fetched — no separate detail fetch
    expect(hybridWebsiteScrapperMock).toHaveBeenCalledTimes(1);
    expect(saveJobMock).toHaveBeenCalledOnce();
    expect(result).toEqual({ processed: 1 });
  });
});

describe("scrapeJob failure handling", () => {
  it("marks the run failed and rethrows when a step throws", async () => {
    loadLookupsMock.mockRejectedValueOnce(new Error("db down"));

    await expect(run()).rejects.toThrow("db down");
    expect(failMock).toHaveBeenCalledWith("run-1", "db down");
    expect(completeMock).not.toHaveBeenCalled();
  });

  it("isolates a per-job save failure: the run still completes with zero processed", async () => {
    saveJobMock.mockRejectedValueOnce(new Error("save failed"));

    const result = await run();

    expect(failMock).not.toHaveBeenCalled();
    expect(completeMock).toHaveBeenCalledWith("run-1", {
      jobsFound: 1,
      jobsInserted: 0,
      jobsUpdated: 0,
      jobsDeactivated: 0,
    });
    expect(result).toEqual({ processed: 0 });
  });

  it("still deactivates using every attempted URL when a detail extraction fails", async () => {
    // Make only the detail-page LLM call fail; the listing stub URL was still attempted.
    callDeepseekJsonMock.mockImplementation(async ({ system }: { system: string }) => {
      if (system === JOB_LISTING_EXTRACTION_SYSTEM) return listingResult;
      throw new Error("detail extraction failed");
    });

    await run();

    expect(saveJobMock).not.toHaveBeenCalled();
    expect(deactivateMissingMock).toHaveBeenCalledWith("src-1", ["https://acme.com/jobs/1"]);
  });
});

describe("scrapeJob pagination", () => {
  it("caps the listing crawl at maxPages", async () => {
    findByIdMock.mockResolvedValueOnce({
      id: "src-1",
      name: "Acme",
      careerPageUrl: "https://acme.com/careers",
      scraperConfig: { maxPages: 2 },
    });
    extractNextPageLinkMock.mockReturnValue("https://acme.com/careers?page=2");

    await run();

    expect(listingCallCount()).toBe(2);
  });
});
