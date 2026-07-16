import { describe, expect, it } from "vitest";
import { fuzzyMatch } from "./fuzzy-match.js";

interface Named {
  name: string;
}

const items: Named[] = [{ name: "Jakarta" }, { name: "Jakarta Selatan" }, { name: "Bandung" }];

describe("fuzzyMatch", () => {
  it("returns undefined for null raw input", () => {
    expect(fuzzyMatch(null, items, (i) => i.name)).toBeUndefined();
  });

  it("returns undefined for undefined raw input", () => {
    expect(fuzzyMatch(undefined, items, (i) => i.name)).toBeUndefined();
  });

  it("returns undefined for empty string raw input", () => {
    expect(fuzzyMatch("", items, (i) => i.name)).toBeUndefined();
  });

  it("matches exactly after default normalization (case + whitespace)", () => {
    expect(fuzzyMatch("  bandung  ", items, (i) => i.name)).toEqual({ name: "Bandung" });
  });

  it("falls back to substring containment when the item name contains the raw value", () => {
    expect(fuzzyMatch("Selatan", items, (i) => i.name)).toEqual({ name: "Jakarta Selatan" });
  });

  it("falls back to substring containment when the raw value contains the item name", () => {
    expect(fuzzyMatch("Jakarta Pusat DKI", items, (i) => i.name)).toEqual({ name: "Jakarta" });
  });

  it("prefers an exact match over a substring match", () => {
    expect(fuzzyMatch("jakarta", items, (i) => i.name)).toEqual({ name: "Jakarta" });
  });

  it("returns undefined when nothing matches", () => {
    expect(fuzzyMatch("Surabaya", items, (i) => i.name)).toBeUndefined();
  });

  it("uses a custom normalize function instead of the default", () => {
    const upper = [{ name: "FOO" }, { name: "BAR" }];
    const normalize = (s: string) => s.toUpperCase();
    expect(fuzzyMatch("foo", upper, (i) => i.name, normalize)).toEqual({ name: "FOO" });
  });
});
