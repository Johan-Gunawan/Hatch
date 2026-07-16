import { describe, expect, it } from "vitest";
import { filterCareerLinks } from "./filter-career-links.js";

describe("filterCareerLinks", () => {
  it("matches a link by text keyword", () => {
    const links = [
      { text: "Careers", url: "https://example.com/about-us" },
      { text: "About", url: "https://example.com/about" },
    ];
    const result = filterCareerLinks(links);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Careers");
  });

  it("matches a link by URL keyword", () => {
    const links = [
      { text: "Join Us", url: "https://example.com/careers" },
      { text: "Contact", url: "https://example.com/contact" },
    ];
    const result = filterCareerLinks(links);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe("https://example.com/careers");
  });

  it("excludes unrelated nav links when a career link is present", () => {
    const links = [
      { text: "About", url: "https://example.com/about" },
      { text: "Contact", url: "https://example.com/contact" },
      { text: "Privacy Policy", url: "https://example.com/privacy" },
      { text: "Careers", url: "https://example.com/careers" },
    ];
    const result = filterCareerLinks(links);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe("https://example.com/careers");
  });

  it("dedupes identical URLs with different text", () => {
    const links = [
      { text: "Careers", url: "https://example.com/careers" },
      { text: "Karir", url: "https://example.com/careers" },
    ];
    const result = filterCareerLinks(links);
    expect(result).toHaveLength(1);
  });

  it("falls back to capped unfiltered links when nothing matches", () => {
    const links = Array.from({ length: 40 }, (_, i) => ({
      text: `Link ${i}`,
      url: `https://example.com/page-${i}`,
    }));
    const result = filterCareerLinks(links);
    expect(result).toHaveLength(30);
    expect(result[0].url).toBe("https://example.com/page-0");
  });
});
