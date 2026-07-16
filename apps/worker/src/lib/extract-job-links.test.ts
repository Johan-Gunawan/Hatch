import { describe, expect, it } from "vitest";
import { extractJobDetailLinks } from "./extract-job-links.js";

const BASE = "https://alfakarir.alfamart.co.id/vacancy";

// Minimal HTML fixture mimicking Alfamart's job card structure
const ALFAMART_HTML = `
<html><body>
  <a href="/vacancy-detail/branch-cianjur/lowongan-crew-store-kab-sukabumi/OGdZYllZ">Crew Store</a>
  <a href="/vacancy-detail/branch-cilacap/lowongan-it-store-support/QllKYlJ4">IT Store Support</a>
  <a href="/vacancy-detail/head-office/lowongan-legal-commercial-specialist/OCtzSnBK">Legal Specialist</a>

  <!-- Listing page itself — must be excluded -->
  <a href="/vacancy">All Vacancies</a>
  <a href="https://alfakarir.alfamart.co.id/vacancy">All Vacancies (absolute)</a>

  <!-- External links — must be excluded -->
  <a href="https://linkedin.com/jobs/view/123">LinkedIn</a>
  <a href="https://alfamidi.co.id/careers">Alfamidi</a>

  <!-- Navigation / utility links — no job keyword, must be excluded -->
  <a href="/about">About</a>
  <a href="/contact">Contact</a>
  <a href="https://alfakarir.alfamart.co.id/login">Login</a>
</body></html>
`;

describe("extractJobDetailLinks", () => {
  it("extracts vacancy-detail links from Alfamart career page", () => {
    const links = extractJobDetailLinks(ALFAMART_HTML, BASE);
    expect(links).toHaveLength(3);
    expect(links).toContain(
      "https://alfakarir.alfamart.co.id/vacancy-detail/branch-cianjur/lowongan-crew-store-kab-sukabumi/OGdZYllZ"
    );
    expect(links).toContain(
      "https://alfakarir.alfamart.co.id/vacancy-detail/head-office/lowongan-legal-commercial-specialist/OCtzSnBK"
    );
  });

  it("excludes the listing page URL itself", () => {
    const links = extractJobDetailLinks(ALFAMART_HTML, BASE);
    expect(links).not.toContain("https://alfakarir.alfamart.co.id/vacancy");
  });

  it("excludes external domains", () => {
    const links = extractJobDetailLinks(ALFAMART_HTML, BASE);
    expect(links.some((l) => l.includes("linkedin.com"))).toBe(false);
    expect(links.some((l) => l.includes("alfamidi.co.id"))).toBe(false);
  });

  it("excludes navigation and utility links with no job keyword", () => {
    const links = extractJobDetailLinks(ALFAMART_HTML, BASE);
    expect(links.some((l) => l.includes("/about"))).toBe(false);
    expect(links.some((l) => l.includes("/login"))).toBe(false);
  });

  it("deduplicates identical URLs (strips query string and hash)", () => {
    const dupeHtml = `
      <a href="/vacancy-detail/branch-a/job-x/ID1">Job X</a>
      <a href="/vacancy-detail/branch-a/job-x/ID1">Job X (duplicate)</a>
      <a href="/vacancy-detail/branch-a/job-x/ID1?ref=email">Job X (with query)</a>
    `;
    const links = extractJobDetailLinks(dupeHtml, BASE);
    expect(links).toHaveLength(1);
  });

  it("resolves relative paths to absolute URLs", () => {
    const html = `<a href="/vacancy-detail/ho/lowongan-manager/ABC123">Manager</a>`;
    const links = extractJobDetailLinks(html, BASE);
    expect(links[0]).toBe(
      "https://alfakarir.alfamart.co.id/vacancy-detail/ho/lowongan-manager/ABC123"
    );
  });

  it("also matches standard /jobs/ and /careers/ patterns", () => {
    const html = `
      <a href="/jobs/123-software-engineer">SE</a>
      <a href="/careers/opening/frontend-dev">FE</a>
    `;
    const links = extractJobDetailLinks(html, "https://example.com/careers");
    expect(links).toHaveLength(2);
  });

  it("caps results at 500 links", () => {
    const manyLinks = Array.from(
      { length: 600 },
      (_, i) => `<a href="/vacancy-detail/branch-x/job-${i}/ID${i}">Job ${i}</a>`
    ).join("\n");
    const links = extractJobDetailLinks(manyLinks, BASE);
    expect(links).toHaveLength(500);
  });
});
