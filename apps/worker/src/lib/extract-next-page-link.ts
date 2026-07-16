const NEXT_TEXT_RE = /^(next|berikutnya|selanjutnya|»|›|>)$/i;
const PAGE_PARAM_NAMES = ["page", "p", "offset"];

export function extractNextPageLink(
  links: Array<{ text: string; url: string }>,
  currentUrl: string
): string | null {
  const origin = new URL(currentUrl).origin;
  const currentPage = new URL(currentUrl);

  for (const link of links) {
    let candidate: URL;
    try {
      candidate = new URL(link.url, currentUrl);
    } catch {
      continue;
    }

    if (candidate.origin !== origin) continue;
    if (candidate.href === currentPage.href) continue;

    if (NEXT_TEXT_RE.test(link.text.trim())) {
      return candidate.href;
    }
  }

  for (const link of links) {
    let candidate: URL;
    try {
      candidate = new URL(link.url, currentUrl);
    } catch {
      continue;
    }

    if (candidate.origin !== origin) continue;
    if (candidate.pathname !== currentPage.pathname) continue;

    const paramName = PAGE_PARAM_NAMES.find((name) => candidate.searchParams.has(name));
    if (!paramName) continue;

    const candidateValue = Number(candidate.searchParams.get(paramName));
    const currentValue = Number(currentPage.searchParams.get(paramName) ?? "0");

    if (Number.isFinite(candidateValue) && candidateValue === currentValue + 1) {
      return candidate.href;
    }
  }

  return null;
}
