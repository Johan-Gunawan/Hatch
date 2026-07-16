import type { PageLink } from "./filter-career-links.js";

const CAREER_PATH_GUESSES = [
  "/careers",
  "/karir",
  "/jobs",
  "/lowongan",
  "/join",
  "/join-us",
  "/recruitment",
  "/lowongan-kerja",
  "/career",
  "/job",
];

const PROBE_TIMEOUT_MS = 5_000;

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

async function probeUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": BROWSER_UA },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      redirect: "follow",
    });
    // 2xx or redirect that resolved to 2xx counts as valid
    return res.ok ? url : null;
  } catch {
    return null;
  }
}

export async function probeCareerUrls(baseOrigin: string): Promise<PageLink[]> {
  const candidates = CAREER_PATH_GUESSES.map((path) => `${baseOrigin}${path}`);
  console.log("probe-career-urls", { baseOrigin, candidates });

  const results = await Promise.allSettled(candidates.map(probeUrl));

  const valid: PageLink[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      valid.push({ text: "Careers", url: result.value });
    }
  }

  console.log("probe-career-urls", { found: valid.length, valid });
  return valid;
}
