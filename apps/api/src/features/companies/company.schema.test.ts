import { describe, expect, it } from "vitest";
import { CompanyListQuerySchema, ScrapeRequestSchema } from "./company.schema.js";

describe("ScrapeRequestSchema", () => {
  it("accepts a single valid URL", () => {
    expect(ScrapeRequestSchema.safeParse({ urls: ["https://example.com"] }).success).toBe(true);
  });

  it("rejects an empty urls array", () => {
    expect(ScrapeRequestSchema.safeParse({ urls: [] }).success).toBe(false);
  });

  it("rejects more than 100 urls", () => {
    const urls = Array.from({ length: 101 }, (_, i) => `https://example.com/${i}`);
    expect(ScrapeRequestSchema.safeParse({ urls }).success).toBe(false);
  });

  it("accepts exactly 100 urls", () => {
    const urls = Array.from({ length: 100 }, (_, i) => `https://example.com/${i}`);
    expect(ScrapeRequestSchema.safeParse({ urls }).success).toBe(true);
  });

  it("rejects a non-URL string in the urls array", () => {
    expect(ScrapeRequestSchema.safeParse({ urls: ["not-a-url"] }).success).toBe(false);
  });
});

describe("CompanyListQuerySchema", () => {
  it("defaults limit to 50 when omitted", () => {
    expect(CompanyListQuerySchema.parse({}).limit).toBe(50);
  });

  it("coerces a numeric string limit", () => {
    expect(CompanyListQuerySchema.parse({ limit: "10" }).limit).toBe(10);
  });

  it("rejects a limit above the 100 cap", () => {
    expect(CompanyListQuerySchema.safeParse({ limit: "101" }).success).toBe(false);
  });

  it("rejects a zero or negative limit", () => {
    expect(CompanyListQuerySchema.safeParse({ limit: "0" }).success).toBe(false);
  });
});
