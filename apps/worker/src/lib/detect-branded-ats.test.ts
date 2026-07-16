import { describe, expect, it, vi } from "vitest";

const callDeepseekJsonMock = vi.fn();

// detectBrandedAts's direct collaborator is callDeepseekJson (which now lives in
// @repo/ai and is re-exported from ./llm-json.js). Mock that seam and assert
// detectBrandedAts's own behavior: it validates the returned JSON with zod and
// fails open on any error. JSON sanitizing/parsing is @repo/ai's concern and is
// covered by its own tests.
vi.mock("./llm-json.js", () => ({
  callDeepseekJson: callDeepseekJsonMock,
}));

const { detectBrandedAts } = await import("./detect-branded-ats.js");

const LINKS = [{ text: "Apply", url: "https://careers.example.com/apply" }];

describe("detectBrandedAts", () => {
  it("returns the parsed verdict for a branded ATS page", async () => {
    callDeepseekJsonMock.mockResolvedValueOnce({
      isBrandedAts: true,
      atsPlatform: "greenhouse",
      reason: "found script src boards.greenhouse.io",
    });

    const verdict = await detectBrandedAts(
      '<script src="https://boards.greenhouse.io/embed/job_board"></script>',
      "Careers at Example",
      LINKS,
      "https://careers.example.com"
    );

    expect(verdict).toEqual({
      isBrandedAts: true,
      atsPlatform: "greenhouse",
      reason: "found script src boards.greenhouse.io",
    });
  });

  it("returns the parsed verdict for a custom-built page", async () => {
    callDeepseekJsonMock.mockResolvedValueOnce({
      isBrandedAts: false,
      atsPlatform: null,
      reason: "no vendor markers found",
    });

    const verdict = await detectBrandedAts(
      "<html><body>Custom careers page</body></html>",
      "Custom careers page",
      LINKS,
      "https://careers.example.com"
    );

    expect(verdict.isBrandedAts).toBe(false);
    expect(verdict.atsPlatform).toBeNull();
  });

  it("fails open when the LLM call throws", async () => {
    callDeepseekJsonMock.mockRejectedValueOnce(new Error("network error"));

    const verdict = await detectBrandedAts(
      "<html></html>",
      "",
      LINKS,
      "https://careers.example.com"
    );

    expect(verdict.isBrandedAts).toBe(false);
    expect(verdict.atsPlatform).toBeNull();
  });

  it("fails open when the model output can't be parsed", async () => {
    // callDeepseekJson throws when the raw model text isn't valid JSON.
    callDeepseekJsonMock.mockRejectedValueOnce(new SyntaxError("Unexpected token"));

    const verdict = await detectBrandedAts(
      "<html></html>",
      "",
      LINKS,
      "https://careers.example.com"
    );

    expect(verdict.isBrandedAts).toBe(false);
    expect(verdict.atsPlatform).toBeNull();
  });

  it("fails open when the model returns a schema-violating shape", async () => {
    callDeepseekJsonMock.mockResolvedValueOnce({ isBrandedAts: "yes" });

    const verdict = await detectBrandedAts(
      "<html></html>",
      "",
      LINKS,
      "https://careers.example.com"
    );

    expect(verdict.isBrandedAts).toBe(false);
    expect(verdict.atsPlatform).toBeNull();
  });
});
