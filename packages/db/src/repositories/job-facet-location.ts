// Pure helper for JobRepository.getFacetOptions: turns the raw, comma-joined
// locationRaw text on active jobs into a deduped list of canonical province/
// district names suitable for the jobs-board location filter facet.
export function resolveLocationFacetTokens(
  locationRawValues: (string | null)[],
  canonicalNames: string[]
): string[] {
  const canonicalLower = new Set(canonicalNames.map((name) => name.toLowerCase()));

  const seen = new Set<string>();
  const tokens: string[] = [];
  for (const locationRaw of locationRawValues) {
    if (!locationRaw) continue;
    for (const part of locationRaw.split(",")) {
      const token = part.trim();
      if (!token) continue;
      const lower = token.toLowerCase();
      if (canonicalLower.has(lower) && !seen.has(lower)) {
        seen.add(lower);
        tokens.push(token);
      }
    }
  }
  tokens.sort((a, b) => a.localeCompare(b));
  return tokens;
}
