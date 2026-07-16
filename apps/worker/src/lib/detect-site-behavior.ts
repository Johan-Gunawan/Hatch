import * as cheerio from "cheerio";
import { JOB_DETAIL_RE } from "./extract-job-links.js";

export interface SiteBehaviorSignals {
  requiresJsRender: boolean;
  loadMoreSelector: string | null;
}

const THIN_TEXT_THRESHOLD = 200;

// Telltale markers of a client-rendered SPA shell (Next.js, React, Angular, generic
// `#root`/`#app` mount points) — corroborates a thin-content signal before we conclude
// the plain fetch returned an unrendered shell rather than a genuinely sparse static page.
const SPA_MARKER_RE = /id=["'](?:root|app)["']|__NEXT_DATA__|ng-version|data-reactroot/i;

const LOAD_MORE_TEXT_RE =
  /load\s*more|muat\s*lebih|lihat\s*lainnya|selengkapnya|tampilkan\s*(semua|lebih)/i;

function countJobLikeLinks(links: Array<{ text: string; url: string }>, currentUrl: string) {
  let count = 0;
  for (const link of links) {
    try {
      if (JOB_DETAIL_RE.test(new URL(link.url, currentUrl).pathname)) count++;
    } catch {
      // ignore unparsable URLs
    }
  }
  return count;
}

function findLoadMoreSelector(rawHtml: string): string | null {
  const $ = cheerio.load(rawHtml);
  let selector: string | null = null;

  $("button, a, div[role='button']").each((_, el) => {
    if (selector) return;

    const node = $(el);
    const text = node.text().trim();
    if (!LOAD_MORE_TEXT_RE.test(text)) return;

    const href = node.attr("href");
    const isRealLink = href && href !== "#" && !href.startsWith("javascript:");
    if (isRealLink) return;

    const id = node.attr("id");
    const className = node.attr("class")?.trim().split(/\s+/)[0];
    selector = id ? `#${id}` : className ? `.${className}` : el.tagName.toLowerCase();
  });

  return selector;
}

export function detectSiteBehavior(
  rawHtml: string,
  cleanText: string,
  links: Array<{ text: string; url: string }>,
  currentUrl: string
): SiteBehaviorSignals {
  const isThin =
    cleanText.trim().length < THIN_TEXT_THRESHOLD || countJobLikeLinks(links, currentUrl) === 0;
  const requiresJsRender = isThin && SPA_MARKER_RE.test(rawHtml);

  return {
    requiresJsRender,
    loadMoreSelector: requiresJsRender ? null : findLoadMoreSelector(rawHtml),
  };
}
