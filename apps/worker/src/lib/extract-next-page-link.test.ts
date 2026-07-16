import { describe, expect, it } from "vitest";
import { extractNextPageLink } from "./extract-next-page-link.js";

const CURRENT = "https://example.com/careers?page=1";

describe("extractNextPageLink", () => {
  it("detects an English 'next' text link", () => {
    const links = [
      { text: "Home", url: "https://example.com/" },
      { text: "Next", url: "https://example.com/careers?page=2" },
    ];
    expect(extractNextPageLink(links, CURRENT)).toBe("https://example.com/careers?page=2");
  });

  it("detects an Indonesian 'berikutnya' text link", () => {
    const links = [{ text: "Berikutnya", url: "https://example.com/careers?page=2" }];
    expect(extractNextPageLink(links, CURRENT)).toBe("https://example.com/careers?page=2");
  });

  it("detects a same-path incrementing page query param when no text match exists", () => {
    const links = [
      { text: "1", url: "https://example.com/careers?page=1" },
      { text: "2", url: "https://example.com/careers?page=2" },
      { text: "3", url: "https://example.com/careers?page=3" },
    ];
    expect(extractNextPageLink(links, CURRENT)).toBe("https://example.com/careers?page=2");
  });

  it("returns null when no next-page link is present (last page)", () => {
    const links = [
      { text: "Previous", url: "https://example.com/careers?page=0" },
      { text: "About", url: "https://example.com/about" },
    ];
    expect(extractNextPageLink(links, CURRENT)).toBeNull();
  });

  it("ignores off-origin links even if the text matches", () => {
    const links = [{ text: "Next", url: "https://other-domain.com/careers?page=2" }];
    expect(extractNextPageLink(links, CURRENT)).toBeNull();
  });

  it("ignores malformed URLs without throwing", () => {
    const links = [
      { text: "Next", url: "https://[invalid" },
      { text: "Next", url: "https://example.com/careers?page=2" },
    ];
    expect(extractNextPageLink(links, CURRENT)).toBe("https://example.com/careers?page=2");
  });

  it("resolves relative URLs against the current page", () => {
    const links = [{ text: "Next", url: "/careers?page=2" }];
    expect(extractNextPageLink(links, CURRENT)).toBe("https://example.com/careers?page=2");
  });
});
