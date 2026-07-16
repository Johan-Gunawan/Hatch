import type { Industry } from "@repo/db";
import { fuzzyMatch } from "./fuzzy-match.js";

export function matchIndustry(
  raw: string | null | undefined,
  industries: Industry[]
): Industry | undefined {
  return fuzzyMatch(raw, industries, (i) => i.name);
}
