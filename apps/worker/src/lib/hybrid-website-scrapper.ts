import { chromium } from "playwright";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
};

export interface HybridScrapperOptions {
  // Skip the plain-fetch attempt and go straight to Playwright — set once a job source
  // is known to be a JS-rendered SPA, so we don't waste a request on an empty shell every run.
  forcePlaywright?: boolean;
  // CSS selector for a "load more" style control with no real href; clicked repeatedly
  // before reading page content. Best-effort: failures are swallowed and whatever content
  // is already loaded is returned.
  loadMoreSelector?: string | null;
  // After a successful plain fetch, check whether the response looks like an unrendered SPA
  // shell (thin text + React/Angular/Next.js mount markers). If detected, automatically
  // discard the shell and retry with Playwright to get the fully-rendered DOM.
  retrySpashell?: boolean;
}

const SPA_SHELL_MARKER_RE = /id=["'](?:root|app)["']|__NEXT_DATA__|ng-version|data-reactroot/i;
const SPA_THIN_TEXT_THRESHOLD = 400;

function isSpashell(html: string): boolean {
  if (!SPA_SHELL_MARKER_RE.test(html)) return false;
  const plainText = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const isSpashell = plainText.length < SPA_THIN_TEXT_THRESHOLD;
  console.log("isSpashell", { plainTextLength: plainText.length, isSpashell });
  return isSpashell;
}

const MAX_LOAD_MORE_CLICKS = 5;

export const hybridWebsiteScrapper = async (url: string, options?: HybridScrapperOptions) => {
  console.log(url);
  console.log(options);
  if (!options?.forcePlaywright) {
    try {
      const res = await fetch(url, { headers: BROWSER_HEADERS });
      if (res.ok) {
        const html = await res.text();
        if (options?.retrySpashell && isSpashell(html)) {
          console.log("hybrid-website-scrapper", {
            event: "spa-shell-detected-retrying-playwright",
            url,
          });
        } else {
          return html;
        }
      }
    } catch (err) {
      console.log(`plain fetch failed for ${url}, falling back to Playwright:`, err);
    }
  }

  const browser = await chromium.launch({
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const context = await browser.newContext({
    userAgent: BROWSER_HEADERS["User-Agent"],
    viewport: { width: 1280, height: 800 },
    locale: "id-ID",
    extraHTTPHeaders: {
      "Accept-Language": BROWSER_HEADERS["Accept-Language"],
      Accept: BROWSER_HEADERS.Accept,
    },
  });
  try {
    const page = await context.newPage();
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    if (response && response.status() >= 400) {
      throw new Error(`HTTP ${response.status()} fetching ${url}`);
    }

    try {
      await page.waitForLoadState("networkidle", { timeout: 30_000 });
    } catch (err) {
      console.log(`networkidle wait timed out for ${url}, using current content:`, err);
    }

    if (options?.loadMoreSelector) {
      const button = page.locator(options.loadMoreSelector).first();
      for (let i = 0; i < MAX_LOAD_MORE_CLICKS; i++) {
        try {
          if (!(await button.isVisible({ timeout: 2_000 }))) break;
          await button.click({ timeout: 5_000 });
          await page.waitForLoadState("networkidle", { timeout: 15_000 });
        } catch (err) {
          console.log(`load-more click loop stopped for ${url}:`, err);
          break;
        }
      }
    }

    return await page.content();
  } finally {
    await browser.close();
  }
};
