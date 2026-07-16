import { describe, expect, it } from "vitest";
import { detectSiteBehavior } from "./detect-site-behavior.js";

const currentUrl = "https://example.com/careers";

describe("detectSiteBehavior", () => {
  it("does not require JS rendering when content is substantial and job links exist", () => {
    const cleanText = "x".repeat(300);
    const links = [{ text: "Engineer", url: "/jobs/1" }];
    const result = detectSiteBehavior("<html></html>", cleanText, links, currentUrl);
    expect(result.requiresJsRender).toBe(false);
  });

  it("requires JS rendering when content is thin AND an SPA marker is present", () => {
    const cleanText = "short";
    const rawHtml = '<div id="root"></div>';
    const result = detectSiteBehavior(rawHtml, cleanText, [], currentUrl);
    expect(result.requiresJsRender).toBe(true);
  });

  it("requires JS rendering when there are zero job-like links AND an SPA marker is present", () => {
    const cleanText = "x".repeat(300);
    const rawHtml = "<div>__NEXT_DATA__</div>";
    const links = [{ text: "About", url: "/about" }];
    const result = detectSiteBehavior(rawHtml, cleanText, links, currentUrl);
    expect(result.requiresJsRender).toBe(true);
  });

  it("does not require JS rendering when thin but no SPA marker is present", () => {
    const cleanText = "short";
    const result = detectSiteBehavior("<html><body>short</body></html>", cleanText, [], currentUrl);
    expect(result.requiresJsRender).toBe(false);
  });

  it("returns a null loadMoreSelector whenever JS rendering is required", () => {
    const rawHtml = '<div id="root"><button>Load more</button></div>';
    const result = detectSiteBehavior(rawHtml, "short", [], currentUrl);
    expect(result.requiresJsRender).toBe(true);
    expect(result.loadMoreSelector).toBeNull();
  });

  it("finds a load-more button by id when JS rendering is not required", () => {
    const cleanText = "x".repeat(300);
    const links = [{ text: "Engineer", url: "/jobs/1" }];
    const rawHtml = '<button id="load-more-btn">Load More</button>';
    const result = detectSiteBehavior(rawHtml, cleanText, links, currentUrl);
    expect(result.loadMoreSelector).toBe("#load-more-btn");
  });

  it("falls back to the class selector when there is no id", () => {
    const cleanText = "x".repeat(300);
    const links = [{ text: "Engineer", url: "/jobs/1" }];
    const rawHtml = '<button class="btn-load">Muat Lebih</button>';
    const result = detectSiteBehavior(rawHtml, cleanText, links, currentUrl);
    expect(result.loadMoreSelector).toBe(".btn-load");
  });

  it("falls back to the tag name when there is no id or class", () => {
    const cleanText = "x".repeat(300);
    const links = [{ text: "Engineer", url: "/jobs/1" }];
    const rawHtml = "<button>Lihat Lainnya</button>";
    const result = detectSiteBehavior(rawHtml, cleanText, links, currentUrl);
    expect(result.loadMoreSelector).toBe("button");
  });

  it("ignores a load-more-looking element that is a real navigable link", () => {
    const cleanText = "x".repeat(300);
    const links = [{ text: "Engineer", url: "/jobs/1" }];
    const rawHtml = '<a href="/all-jobs">Load More</a>';
    const result = detectSiteBehavior(rawHtml, cleanText, links, currentUrl);
    expect(result.loadMoreSelector).toBeNull();
  });

  it("accepts a load-more anchor whose href is just '#'", () => {
    const cleanText = "x".repeat(300);
    const links = [{ text: "Engineer", url: "/jobs/1" }];
    const rawHtml = '<a href="#" id="show-more">Selengkapnya</a>';
    const result = detectSiteBehavior(rawHtml, cleanText, links, currentUrl);
    expect(result.loadMoreSelector).toBe("#show-more");
  });

  it("returns null when no load-more element is present", () => {
    const cleanText = "x".repeat(300);
    const links = [{ text: "Engineer", url: "/jobs/1" }];
    const rawHtml = "<div>No such button here</div>";
    const result = detectSiteBehavior(rawHtml, cleanText, links, currentUrl);
    expect(result.loadMoreSelector).toBeNull();
  });
});
