import type { Industry } from "@repo/db";
import { describe, expect, it } from "vitest";
import { matchIndustry } from "./match-industry.js";

const industries = [
  { id: "1", name: "Information Technology" },
  { id: "2", name: "Finance" },
] as Industry[];

describe("matchIndustry", () => {
  it("matches an exact name case-insensitively", () => {
    expect(matchIndustry("finance", industries)).toEqual({ id: "2", name: "Finance" });
  });

  it("falls back to substring containment", () => {
    expect(matchIndustry("Information Technology (IT)".slice(0, 23), industries)).toEqual({
      id: "1",
      name: "Information Technology",
    });
  });

  it("returns undefined when nothing matches", () => {
    expect(matchIndustry("Healthcare", industries)).toBeUndefined();
  });

  it("returns undefined for null input", () => {
    expect(matchIndustry(null, industries)).toBeUndefined();
  });

  it("returns undefined for undefined input", () => {
    expect(matchIndustry(undefined, industries)).toBeUndefined();
  });
});
