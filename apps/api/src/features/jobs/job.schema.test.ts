import { describe, expect, it } from "vitest";
import { JobListQuerySchema } from "./job.schema.js";

describe("JobListQuerySchema", () => {
  it("applies defaults when only required-free fields are omitted", () => {
    const result = JobListQuerySchema.parse({});
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(0);
    expect(result.sortBy).toBe("relevance");
    expect(result.categoryIds).toEqual([]);
    expect(result.isActive).toBeUndefined();
  });

  it("splits a comma-separated csvList param into an array", () => {
    const result = JobListQuerySchema.parse({ categoryIds: "a,b,c" });
    expect(result.categoryIds).toEqual(["a", "b", "c"]);
  });

  it("filters out empty segments from a trailing comma in a csvList param", () => {
    const result = JobListQuerySchema.parse({ locations: "Jakarta,,Bandung," });
    expect(result.locations).toEqual(["Jakarta", "Bandung"]);
  });

  it('treats an empty-string csvList param as an empty array, not [""]', () => {
    const result = JobListQuerySchema.parse({ companies: "" });
    expect(result.companies).toEqual([]);
  });

  it("coerces the isActive string param to a real boolean", () => {
    expect(JobListQuerySchema.parse({ isActive: "true" }).isActive).toBe(true);
    expect(JobListQuerySchema.parse({ isActive: "false" }).isActive).toBe(false);
  });

  it("leaves isActive undefined (not false) when the param is omitted", () => {
    expect(JobListQuerySchema.parse({}).isActive).toBeUndefined();
  });

  it("rejects an isActive value that isn't the literal string 'true' or 'false'", () => {
    expect(JobListQuerySchema.safeParse({ isActive: "yes" }).success).toBe(false);
  });

  it("coerces numeric string params for limit/offset/minSalary", () => {
    const result = JobListQuerySchema.parse({ limit: "10", offset: "20", minSalary: "5000000" });
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(20);
    expect(result.minSalary).toBe(5000000);
  });

  it("rejects a negative offset", () => {
    expect(JobListQuerySchema.safeParse({ offset: "-1" }).success).toBe(false);
  });

  it("rejects a limit above the 500 cap", () => {
    expect(JobListQuerySchema.safeParse({ limit: "501" }).success).toBe(false);
  });

  it("rejects a non-integer limit", () => {
    expect(JobListQuerySchema.safeParse({ limit: "10.5" }).success).toBe(false);
  });

  it("rejects a zero or negative limit", () => {
    expect(JobListQuerySchema.safeParse({ limit: "0" }).success).toBe(false);
  });

  it("defaults sortBy to relevance and rejects an unknown sort value", () => {
    expect(JobListQuerySchema.parse({}).sortBy).toBe("relevance");
    expect(JobListQuerySchema.safeParse({ sortBy: "cheapest" }).success).toBe(false);
  });

  it("accepts each valid sortBy option", () => {
    for (const sortBy of ["relevance", "newest", "salary"]) {
      expect(JobListQuerySchema.safeParse({ sortBy }).success).toBe(true);
    }
  });
});
