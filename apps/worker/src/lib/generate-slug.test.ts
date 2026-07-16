import { beforeEach, describe, expect, it, vi } from "vitest";
import { slugify } from "./generate-slug.js";

vi.mock("@repo/db", () => ({
  companyRepo: {
    findBySlug: vi.fn(),
  },
}));

describe("slugify", () => {
  it("lowercases and hyphenates a simple name", () => {
    expect(slugify("Acme Corp")).toBe("acme-corp");
  });

  it("strips diacritics before slugifying", () => {
    expect(slugify("Café Résumé")).toBe("cafe-resume");
  });

  it("collapses runs of punctuation and whitespace into a single hyphen", () => {
    expect(slugify("PT.  Foo & Bar, Tbk.")).toBe("pt-foo-bar-tbk");
  });

  it("strips leading and trailing hyphens", () => {
    expect(slugify("--Foo Bar--")).toBe("foo-bar");
  });

  it("returns an empty string for input with no alphanumeric characters", () => {
    expect(slugify("!!!")).toBe("");
  });

  it("leaves an already-clean slug unchanged", () => {
    expect(slugify("already-clean")).toBe("already-clean");
  });
});

describe("generateUniqueSlug", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns the base slug when it is not taken", async () => {
    const { companyRepo } = await import("@repo/db");
    vi.mocked(companyRepo.findBySlug).mockResolvedValueOnce(null);
    const { generateUniqueSlug } = await import("./generate-slug.js");

    await expect(generateUniqueSlug("Acme Corp")).resolves.toBe("acme-corp");
  });

  it("appends an incrementing numeric suffix on collision", async () => {
    const { companyRepo } = await import("@repo/db");
    vi.mocked(companyRepo.findBySlug)
      .mockResolvedValueOnce({ id: "1" } as never)
      .mockResolvedValueOnce({ id: "2" } as never)
      .mockResolvedValueOnce(null);
    const { generateUniqueSlug } = await import("./generate-slug.js");

    await expect(generateUniqueSlug("Acme Corp")).resolves.toBe("acme-corp-3");
  });

  it("falls back to a timestamp suffix after exhausting all numbered attempts", async () => {
    const { companyRepo } = await import("@repo/db");
    vi.mocked(companyRepo.findBySlug).mockResolvedValue({ id: "taken" } as never);
    const { generateUniqueSlug } = await import("./generate-slug.js");

    const result = await generateUniqueSlug("Acme Corp");
    expect(result).toMatch(/^acme-corp-\d+$/);
    expect(result).not.toBe("acme-corp-10");
  });
});
