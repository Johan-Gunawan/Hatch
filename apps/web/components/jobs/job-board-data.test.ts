import { describe, expect, it } from "vitest";
import { buildJobListQuery, uniqueSorted } from "./job-board-data";

describe("uniqueSorted", () => {
  it("dedupes repeated values", () => {
    expect(uniqueSorted(["Jakarta", "Jakarta", "Bandung"])).toEqual(["Bandung", "Jakarta"]);
  });

  it("filters out null, undefined, and empty-string values", () => {
    expect(uniqueSorted(["Jakarta", null, undefined, ""])).toEqual(["Jakarta"]);
  });

  it("sorts values alphabetically", () => {
    expect(uniqueSorted(["Bandung", "Jakarta", "Aceh"])).toEqual(["Aceh", "Bandung", "Jakarta"]);
  });

  it("returns an empty array for an empty input", () => {
    expect(uniqueSorted([])).toEqual([]);
  });
});

describe("buildJobListQuery", () => {
  it("returns an empty string for empty params", () => {
    expect(buildJobListQuery({})).toBe("");
  });

  it("omits undefined params from the query string", () => {
    const qs = buildJobListQuery({ q: undefined, minSalary: undefined });
    expect(qs).toBe("");
  });

  it("serializes booleans as the strings 'true'/'false'", () => {
    expect(buildJobListQuery({ isActive: true })).toBe("isActive=true");
    expect(buildJobListQuery({ isActive: false })).toBe("isActive=false");
  });

  it("joins array params with commas", () => {
    const qs = buildJobListQuery({ categoryIds: ["a", "b", "c"] });
    expect(qs).toBe("categoryIds=a%2Cb%2Cc");
  });

  it("omits array params when the array is empty", () => {
    expect(buildJobListQuery({ categoryIds: [] })).toBe("");
  });

  it("includes minSalary=0 since the check is !== undefined, not truthiness", () => {
    expect(buildJobListQuery({ minSalary: 0 })).toBe("minSalary=0");
  });

  it("omits an empty search query string", () => {
    expect(buildJobListQuery({ q: "" })).toBe("");
  });

  it("includes limit=0 since the check is !== undefined", () => {
    expect(buildJobListQuery({ limit: 0 })).toBe("limit=0");
  });

  it("combines multiple params in a single query string", () => {
    const qs = buildJobListQuery({
      isActive: true,
      limit: 20,
      offset: 0,
      q: "engineer",
      sortBy: "newest",
    });
    const params = new URLSearchParams(qs);
    expect(params.get("isActive")).toBe("true");
    expect(params.get("limit")).toBe("20");
    expect(params.get("offset")).toBe("0");
    expect(params.get("q")).toBe("engineer");
    expect(params.get("sortBy")).toBe("newest");
  });
});
