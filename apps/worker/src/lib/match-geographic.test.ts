import type { District, Province } from "@repo/db";
import { describe, expect, it } from "vitest";
import { matchDistrict, matchProvince } from "./match-geographic.js";

const provinces = [
  { id: "1", name: "Jawa Barat" },
  { id: "2", name: "DKI Jakarta" },
] as Province[];

const districts = [
  { id: "1", name: "Kota Bandung" },
  { id: "2", name: "Kabupaten Bogor" },
] as District[];

describe("matchProvince", () => {
  it("strips the 'provinsi' admin prefix before comparing", () => {
    expect(matchProvince("Provinsi Jawa Barat", provinces)).toEqual({
      id: "1",
      name: "Jawa Barat",
    });
  });

  it("strips the 'dki' admin prefix before comparing", () => {
    expect(matchProvince("DKI Jakarta", provinces)).toEqual({ id: "2", name: "DKI Jakarta" });
  });

  it("collapses extra whitespace left behind after stripping prefixes", () => {
    expect(matchProvince("  Jawa   Barat  ", provinces)).toEqual({ id: "1", name: "Jawa Barat" });
  });

  it("matches case-insensitively", () => {
    expect(matchProvince("jawa barat", provinces)).toEqual({ id: "1", name: "Jawa Barat" });
  });

  it("returns undefined when nothing matches", () => {
    expect(matchProvince("Sumatera Utara", provinces)).toBeUndefined();
  });

  it("returns undefined for null input", () => {
    expect(matchProvince(null, provinces)).toBeUndefined();
  });
});

describe("matchDistrict", () => {
  it("strips the 'kota' admin prefix before comparing", () => {
    expect(matchDistrict("Kota Bandung", districts)).toEqual({ id: "1", name: "Kota Bandung" });
  });

  it("strips the 'kabupaten' admin prefix before comparing", () => {
    expect(matchDistrict("Kabupaten Bogor", districts)).toEqual({
      id: "2",
      name: "Kabupaten Bogor",
    });
  });

  it("matches on the bare district name without the prefix", () => {
    expect(matchDistrict("Bandung", districts)).toEqual({ id: "1", name: "Kota Bandung" });
  });

  it("returns undefined when nothing matches", () => {
    expect(matchDistrict("Surabaya", districts)).toBeUndefined();
  });
});
