import type { District, Province } from "@repo/db";
import { fuzzyMatch } from "./fuzzy-match.js";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b(dki|daerah istimewa|provinsi|kota|kabupaten)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchProvince(
  raw: string | null | undefined,
  provinces: Province[]
): Province | undefined {
  return fuzzyMatch(raw, provinces, (p) => p.name, normalize);
}

export function matchDistrict(
  raw: string | null | undefined,
  districts: District[]
): District | undefined {
  return fuzzyMatch(raw, districts, (d) => d.name, normalize);
}
