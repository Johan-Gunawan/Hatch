import { beforeEach, describe, expect, it, vi } from "vitest";
import { EXPLAIN_SYSTEM } from "./prompts/explain.js";
import { RERANK_SYSTEM } from "./prompts/rerank.js";
import { RESUME_PARSE_SYSTEM } from "./prompts/resume-parse.js";

// resumeService's direct collaborators are the AI layer (@repo/ai) and the DB
// repos (@repo/db). Mock both seams and assert the service's own orchestration:
// the parse→embed→search pipeline, the two fallbacks (relaxed-filters, closest),
// the rerank fail-open, persistence, and explainMatch's not-found handling. The
// prompt modules stay real so their zod schemas run and we can route the shared
// callDeepseekJson mock by `system`.

const callDeepseekJsonMock = vi.fn();
const embedTextMock = vi.fn();
const searchByEmbeddingMock = vi.fn();
const jobFindByIdMock = vi.fn();
const resumeCreateMock = vi.fn();
const saveMatchesMock = vi.fn();
const resumeFindByIdMock = vi.fn();

vi.mock("@repo/ai", () => ({
  DEEPSEEK_MODEL: "test-model",
  callDeepseekJson: callDeepseekJsonMock,
  embedText: embedTextMock,
}));
vi.mock("@repo/db", () => ({
  jobRepo: { searchByEmbedding: searchByEmbeddingMock, findById: jobFindByIdMock },
  resumeRepo: {
    create: resumeCreateMock,
    saveMatches: saveMatchesMock,
    findById: resumeFindByIdMock,
  },
}));

const { resumeService } = await import("./resume.service.js");

const PROFILE = {
  skills: ["React", "TypeScript"],
  jobTitles: ["Frontend Engineer"],
  seniority: "mid",
  yearsExperience: 3,
  locationPref: null,
  summary: "Solid frontend developer",
};

function makeMatch(id: string, score: number) {
  return {
    job: {
      id,
      title: `Job ${id}`,
      companyName: "Acme",
      locationRaw: "Jakarta",
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: "IDR",
      salaryPeriod: null,
      sourceUrl: `https://acme.com/jobs/${id}`,
      description: "Do things",
      requirements: "Know things",
    },
    score,
  };
}

const RESUME_INPUT = { resumeText: "a".repeat(80) };

beforeEach(() => {
  vi.clearAllMocks();
  embedTextMock.mockResolvedValue([0.1, 0.2, 0.3]);
  resumeCreateMock.mockResolvedValue("resume-1");
  saveMatchesMock.mockResolvedValue(undefined);
  searchByEmbeddingMock.mockResolvedValue([makeMatch("a", 0.9), makeMatch("b", 0.8)]);
  callDeepseekJsonMock.mockImplementation(async ({ system }: { system: string }) => {
    if (system === RESUME_PARSE_SYSTEM) return PROFILE;
    if (system === RERANK_SYSTEM) return { rankedIds: ["a", "b"] };
    if (system === EXPLAIN_SYSTEM) return { summary: "Good fit", strengths: ["React"], gaps: [] };
    return {};
  });
});

describe("resumeService.matchResume", () => {
  it("parses, embeds, searches, persists, and returns ranked strong matches", async () => {
    const result = await resumeService.matchResume(RESUME_INPUT);

    expect(embedTextMock).toHaveBeenCalledOnce();
    expect(result.resumeId).toBe("resume-1");
    expect(result.weakMatch).toBe(false);
    expect(result.fallbackUsed).toBe("none");
    expect(result.items.map((i) => i.id)).toEqual(["a", "b"]);
    expect(result.items[0]).toMatchObject({ id: "a", title: "Job a", score: 0.9 });

    // persisted the résumé and its ranked matches
    expect(resumeCreateMock).toHaveBeenCalledOnce();
    expect(saveMatchesMock).toHaveBeenCalledWith("resume-1", [
      { jobId: "a", score: 0.9, rank: 1 },
      { jobId: "b", score: 0.8, rank: 2 },
    ]);
  });

  it("drops pre-filters and retries when the filtered search returns nothing", async () => {
    searchByEmbeddingMock
      .mockResolvedValueOnce([]) // filtered search excludes everything
      .mockResolvedValueOnce([makeMatch("a", 0.9)]); // unfiltered retry finds one

    const result = await resumeService.matchResume({ ...RESUME_INPUT, locations: ["Jakarta"] });

    expect(searchByEmbeddingMock).toHaveBeenCalledTimes(2);
    expect(result.fallbackUsed).toBe("relaxed-filters");
    expect(result.items).toHaveLength(1);
  });

  it("returns no items (not a padded closest-list) when every candidate is below the relevance bar", async () => {
    searchByEmbeddingMock.mockResolvedValueOnce([makeMatch("a", 0.2), makeMatch("b", 0.1)]);

    const result = await resumeService.matchResume(RESUME_INPUT);

    expect(result.weakMatch).toBe(true);
    expect(result.fallbackUsed).toBe("none");
    expect(result.items).toEqual([]);
    // still persists the résumé (audit trail / future re-match), just with no matches saved.
    expect(resumeCreateMock).toHaveBeenCalledOnce();
    expect(saveMatchesMock).toHaveBeenCalledWith("resume-1", []);
  });

  it("keeps only the candidates that clear the relevance bar, dropping irrelevant ones rather than padding them in", async () => {
    searchByEmbeddingMock.mockResolvedValueOnce([makeMatch("a", 0.5), makeMatch("b", 0.1)]);

    const result = await resumeService.matchResume(RESUME_INPUT);

    expect(result.weakMatch).toBe(false);
    expect(result.items.map((i) => i.id)).toEqual(["a"]);
  });

  it("fails open (keeps vector order) when the rerank call throws", async () => {
    callDeepseekJsonMock.mockImplementation(async ({ system }: { system: string }) => {
      if (system === RESUME_PARSE_SYSTEM) return PROFILE;
      if (system === RERANK_SYSTEM) throw new Error("rerank down");
      return {};
    });

    const result = await resumeService.matchResume(RESUME_INPUT);

    expect(result.items.map((i) => i.id)).toEqual(["a", "b"]);
    expect(resumeCreateMock).toHaveBeenCalledOnce();
  });
});

describe("resumeService.explainMatch", () => {
  it("returns null when the résumé does not exist", async () => {
    resumeFindByIdMock.mockResolvedValueOnce(null);
    jobFindByIdMock.mockResolvedValueOnce({ id: "job-1" });

    expect(await resumeService.explainMatch("job-1", "missing")).toBeNull();
  });

  it("returns null when the job does not exist", async () => {
    resumeFindByIdMock.mockResolvedValueOnce({ id: "resume-1", profile: PROFILE });
    jobFindByIdMock.mockResolvedValueOnce(null);

    expect(await resumeService.explainMatch("missing", "resume-1")).toBeNull();
  });

  it("returns the grounded explanation when both exist", async () => {
    resumeFindByIdMock.mockResolvedValueOnce({ id: "resume-1", profile: PROFILE });
    jobFindByIdMock.mockResolvedValueOnce({
      id: "job-1",
      title: "Frontend Engineer",
      description: "d",
      requirements: "r",
    });

    const result = await resumeService.explainMatch("job-1", "resume-1");

    expect(result).toEqual({
      jobId: "job-1",
      summary: "Good fit",
      strengths: ["React"],
      gaps: [],
    });
  });
});
