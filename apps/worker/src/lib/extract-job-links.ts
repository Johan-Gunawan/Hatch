const MAX_LINKS = 500;

// Single source of truth for career/job keywords, shared with filter-career-links.ts.
export const CAREER_KEYWORDS_PATTERN =
  "jobs?|vacancy|careers?|openings?|positions?|postings?|roles?|opportunities?|lowongan|karir";

// Matches paths where a job-related keyword starts a segment, followed by a sub-segment
// (the branch / slug / ID). Using "starts-with" matching so `vacancy` matches `vacancy-detail`.
// Examples matched: /jobs/123, /vacancy-detail/branch/slug/id, /lowongan/marketing-manager
export const JOB_DETAIL_RE = new RegExp(
  `\\/(${CAREER_KEYWORDS_PATTERN})[^/\\s]*\\/[^/\\s?#]{2,}`,
  "i"
);

export function extractJobDetailLinks(html: string, baseUrl: string): string[] {
  const origin = new URL(baseUrl).origin;
  const listingBase = baseUrl.split("?")[0].split("#")[0];

  const seen = new Set<string>();
  const links: string[] = [];

  for (const match of html.matchAll(/href=["']([^"'\s>]+)["']/gi)) {
    const raw = match[1];

    let absolute: string;
    try {
      absolute = new URL(raw, baseUrl).href;
    } catch {
      continue;
    }

    if (!absolute.startsWith(origin)) continue;

    const clean = absolute.split("?")[0].split("#")[0];

    if (clean === listingBase) continue;

    if (JOB_DETAIL_RE.test(new URL(clean).pathname) && !seen.has(clean)) {
      seen.add(clean);
      links.push(clean);
      if (links.length >= MAX_LINKS) break;
    }
  }

  return links;
}
