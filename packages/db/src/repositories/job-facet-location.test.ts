import { describe, expect, it } from "vitest";
import { resolveLocationFacetTokens } from "./job-facet-location.js";

const canonicalNames = ["Jawa Barat", "DKI Jakarta", "Kota Bandung"];

describe("resolveLocationFacetTokens", () => {
  it("keeps a token that exactly matches a canonical name", () => {
    expect(resolveLocationFacetTokens(["Jawa Barat"], canonicalNames)).toEqual(["Jawa Barat"]);
  });

  it("matches case-insensitively but preserves the original casing in the output", () => {
    expect(resolveLocationFacetTokens(["jawa barat"], canonicalNames)).toEqual(["jawa barat"]);
  });

  it("drops tokens that don't match any canonical name", () => {
    expect(resolveLocationFacetTokens(["Surabaya"], canonicalNames)).toEqual([]);
  });

  it("splits a comma-separated locationRaw and keeps only the matching segments", () => {
    expect(resolveLocationFacetTokens(["Kota Bandung, Jawa Barat"], canonicalNames)).toEqual([
      "Jawa Barat",
      "Kota Bandung",
    ]);
  });

  it("dedupes the same canonical token appearing across multiple rows", () => {
    const rows = ["Jawa Barat", "Jawa Barat", "DKI Jakarta"];
    expect(resolveLocationFacetTokens(rows, canonicalNames)).toEqual(["DKI Jakarta", "Jawa Barat"]);
  });

  it("skips null and empty locationRaw values", () => {
    expect(resolveLocationFacetTokens([null, "", "DKI Jakarta"], canonicalNames)).toEqual([
      "DKI Jakarta",
    ]);
  });

  it("skips empty segments produced by consecutive commas", () => {
    expect(resolveLocationFacetTokens(["Jawa Barat,,DKI Jakarta"], canonicalNames)).toEqual([
      "DKI Jakarta",
      "Jawa Barat",
    ]);
  });

  it("returns an empty array when given no location values", () => {
    expect(resolveLocationFacetTokens([], canonicalNames)).toEqual([]);
  });

  it("sorts the kept tokens alphabetically", () => {
    expect(resolveLocationFacetTokens(["Kota Bandung", "DKI Jakarta"], canonicalNames)).toEqual([
      "DKI Jakarta",
      "Kota Bandung",
    ]);
  });
});
