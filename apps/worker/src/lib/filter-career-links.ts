import { CAREER_KEYWORDS_PATTERN } from "./extract-job-links.js";

const CAREER_KEYWORD_RE = new RegExp(CAREER_KEYWORDS_PATTERN, "i");
const FALLBACK_LINK_LIMIT = 30;

export interface PageLink {
  text: string;
  url: string;
}

export function filterCareerLinks(links: PageLink[]): PageLink[] {
  const deduped = dedupeByUrl(links);

  const matched = deduped.filter(
    (link) => CAREER_KEYWORD_RE.test(link.text) || CAREER_KEYWORD_RE.test(link.url)
  );

  if (matched.length > 0) {
    console.log("filter-career-links", { total: deduped.length, matched: matched.length });
    return matched;
  }

  console.log("filter-career-links: no keyword match, falling back to unfiltered links", {
    total: deduped.length,
    cap: FALLBACK_LINK_LIMIT,
  });
  return deduped.slice(0, FALLBACK_LINK_LIMIT);
}

function dedupeByUrl(links: PageLink[]): PageLink[] {
  const seen = new Set<string>();
  const result: PageLink[] = [];
  for (const link of links) {
    if (seen.has(link.url)) continue;
    seen.add(link.url);
    result.push(link);
  }
  return result;
}
