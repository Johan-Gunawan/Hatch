import { beforeEach, describe, expect, it, vi } from "vitest";

// scrapeCompany is an Inngest function whose orchestration is the unit under
// test. We mock inngest.createFunction to hand back the raw handler, mock every
// direct collaborator (fetch/clean lib, the LLM seam, the ATS detector, and the
// company/job-source services), and drive the handler with a fake `step` that
// just runs each step body inline. The zod schemas (CompanySchema) and pure
// prompt builders stay real so we exercise real validation.

const hybridWebsiteScrapperMock = vi.fn();
const optimizerHTMLMock = vi.fn();
const filterCareerLinksMock = vi.fn();
const probeCareerUrlsMock = vi.fn();
const detectBrandedAtsMock = vi.fn();
const callDeepseekJsonMock = vi.fn();
const resolveLookupsMock = vi.fn();
const upsertCompanyMock = vi.fn();
const upsertForCompanyMock = vi.fn();

vi.mock("../client.js", () => ({
  inngest: { createFunction: (_config: unknown, _trigger: unknown, handler: unknown) => handler },
}));
vi.mock("../../lib/hybrid-website-scrapper.js", () => ({
  hybridWebsiteScrapper: hybridWebsiteScrapperMock,
}));
vi.mock("../../lib/optimizer-html.js", () => ({ optimizerHTML: optimizerHTMLMock }));
vi.mock("../../lib/filter-career-links.js", () => ({ filterCareerLinks: filterCareerLinksMock }));
vi.mock("../../lib/probe-career-urls.js", () => ({ probeCareerUrls: probeCareerUrlsMock }));
vi.mock("../../lib/detect-branded-ats.js", () => ({ detectBrandedAts: detectBrandedAtsMock }));
vi.mock("../../lib/llm-json.js", () => ({ callDeepseekJson: callDeepseekJsonMock }));
vi.mock("../../prompts/model.js", () => ({ DEEPSEEK_MODEL: "test-model" }));
vi.mock("../../services/company.service.js", () => ({
  resolveLookups: resolveLookupsMock,
  upsertCompany: upsertCompanyMock,
}));
vi.mock("../../services/job-source.service.js", () => ({
  upsertForCompany: upsertForCompanyMock,
}));

type StepRun = <T>(name: string, fn: () => T | Promise<T>) => Promise<T>;
type Handler = (args: {
  event: { data: { url: string } };
  step: { run: StepRun };
}) => Promise<{ url: string; name: string; companyId?: string }>;

const { scrapeCompany } = await import("./scrape-company.js");
const handler = scrapeCompany as unknown as Handler;

const step = { run: (<T>(_name: string, fn: () => T | Promise<T>) => fn()) as StepRun };

function makeCompanyJson(overrides: Record<string, unknown> = {}) {
  return {
    name: "Acme Corp",
    description: "A company",
    website: "https://acme.com",
    logoUrl: null,
    industryRaw: null,
    provinceRaw: null,
    districtRaw: null,
    employeeCountRange: null,
    careerPageUrl: "https://acme.com/careers",
    ...overrides,
  };
}

function run(url = "https://acme.com") {
  return handler({ event: { data: { url } }, step });
}

beforeEach(() => {
  vi.clearAllMocks();
  hybridWebsiteScrapperMock.mockResolvedValue("<html></html>");
  optimizerHTMLMock.mockReturnValue({
    cleanText: "clean",
    links: [{ text: "Careers", url: "https://acme.com/careers" }],
  });
  filterCareerLinksMock.mockReturnValue([{ text: "Careers", url: "https://acme.com/careers" }]);
  probeCareerUrlsMock.mockResolvedValue([]);
  callDeepseekJsonMock.mockResolvedValue(makeCompanyJson());
  resolveLookupsMock.mockResolvedValue({ provinceId: null, districtId: null, industryId: null });
  upsertCompanyMock.mockResolvedValue({ id: "comp-1", name: "Acme Corp" });
  upsertForCompanyMock.mockResolvedValue({ id: "src-1" });
  detectBrandedAtsMock.mockResolvedValue({
    isBrandedAts: false,
    atsPlatform: null,
    reason: "custom-built",
  });
});

describe("scrapeCompany", () => {
  it("scrapes, extracts, resolves lookups, upserts the company, and returns its id", async () => {
    const result = await run();

    expect(upsertCompanyMock).toHaveBeenCalledOnce();
    expect(result).toEqual({ url: "https://acme.com", name: "Acme Corp", companyId: "comp-1" });
  });

  it("marks a custom-built career page as an active job source (isActive=true)", async () => {
    await run();

    expect(detectBrandedAtsMock).toHaveBeenCalledOnce();
    expect(upsertForCompanyMock).toHaveBeenCalledWith(
      "comp-1",
      { name: "Acme Corp", careerPageUrl: "https://acme.com/careers" },
      { atsPlatform: null, isActive: true }
    );
  });

  it("marks a branded-ATS career page as inactive (isActive=false)", async () => {
    detectBrandedAtsMock.mockResolvedValueOnce({
      isBrandedAts: true,
      atsPlatform: "greenhouse",
      reason: "found boards.greenhouse.io",
    });

    await run();

    expect(upsertForCompanyMock).toHaveBeenCalledWith("comp-1", expect.anything(), {
      atsPlatform: "greenhouse",
      isActive: false,
    });
  });

  it("skips the career-page branch entirely when no career page URL was extracted", async () => {
    callDeepseekJsonMock.mockResolvedValueOnce(makeCompanyJson({ careerPageUrl: null }));

    const result = await run();

    expect(detectBrandedAtsMock).not.toHaveBeenCalled();
    expect(upsertForCompanyMock).not.toHaveBeenCalled();
    expect(result.companyId).toBe("comp-1");
  });

  it("fails open (no ATS call, isActive=true) when the career page fetch throws", async () => {
    // First call = homepage (ok), second call = career page (throws).
    hybridWebsiteScrapperMock
      .mockResolvedValueOnce("<html>home</html>")
      .mockRejectedValueOnce(new Error("career page 500"));

    await run();

    expect(detectBrandedAtsMock).not.toHaveBeenCalled();
    expect(upsertForCompanyMock).toHaveBeenCalledWith("comp-1", expect.anything(), {
      atsPlatform: null,
      isActive: true,
    });
  });

  it("probes candidate career URLs when the homepage exposes no career links", async () => {
    filterCareerLinksMock.mockReturnValueOnce([]);

    await run();

    expect(probeCareerUrlsMock).toHaveBeenCalledOnce();
  });
});
