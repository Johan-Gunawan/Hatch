import * as cheerio from "cheerio";

export const optimizerHTML = (raw: string, url?: string) => {
  const $ = cheerio.load(raw);
  $("script, style, noscript, iframe, svg, option").remove();

  const links: Array<{ text: string; url: string }> = [];

  function resolveHref(href: string, text: string) {
    if (!href || href === "#" || href === "/" || href.startsWith("javascript:")) return;
    try {
      const fullUrl = href.startsWith("http") ? href : new URL(href, url).href;
      links.push({ text, url: fullUrl });
    } catch {
      // unparsable href, skip
    }
  }

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    const text = $(el).text().trim();
    if (href && text) resolveHref(href, text);
  });

  // Non-anchor SPA navigation: data-href / data-to / data-path / data-url / data-route
  $("[data-href],[data-to],[data-path],[data-url],[data-route]").each((_, el) => {
    const node = $(el);
    const href =
      node.attr("data-href") ??
      node.attr("data-to") ??
      node.attr("data-path") ??
      node.attr("data-url") ??
      node.attr("data-route");
    const text = node.text().trim();
    if (href && text) resolveHref(href, text);
  });

  // onclick navigation patterns: onclick="navigate('/path')" / location.href='/path'
  const ONCLICK_PATH_RE = /["'](\/[a-zA-Z][^"'\s]*)/g;
  $("[onclick]").each((_, el) => {
    const onclick = $(el).attr("onclick") ?? "";
    const text = $(el).text().trim();
    if (!text) return;
    for (const match of onclick.matchAll(ONCLICK_PATH_RE)) {
      resolveHref(match[1], text);
    }
  });

  const cleanText = $("body").text().replace(/\s+/g, " ").trim();

  return { links, cleanText };
};
