// Demo-mode masking: when NEXT_PUBLIC_DEMO_MODE=true, real company names and
// career/source URLs are swapped for deterministic fake ones before any page
// or API route hands data to the browser — lets a demo recording go out
// without exposing which real companies were scraped. Off by default.
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function isDemoMode(): boolean {
  return DEMO_MODE;
}

const NAME_PREFIXES = [
  "Northwind",
  "Vertex",
  "Bluepeak",
  "Solstice",
  "Cedarline",
  "Meridian",
  "Palisade",
  "Anchorpoint",
  "Lumen",
  "Ridgeline",
  "Fernwood",
  "Amberfield",
  "Silverline",
  "Ironwood",
  "Brightpeak",
  "Clearwater",
  "Novaline",
  "Crimson Oak",
  "Wayfinder",
  "Harbor Nine",
];

const NAME_SUFFIXES = [
  "Traders",
  "Dynamics",
  "Group",
  "Labs",
  "& Co",
  "Works",
  "Technologies",
  "Inc",
  "Studio",
  "Partners",
  "Digital",
  "Holdings",
  "Systems",
  "Collective",
  "Ventures",
  "Solutions",
];

// djb2-style string hash — deterministic, no external dependency needed.
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const nameCache = new Map<string, string>();

// Same real name always maps to the same fake name, so a company stays
// recognizable-but-fake across every table/card/filter in one recording.
export function maskCompanyName(name: string): string;
export function maskCompanyName(name: string | null): string | null;
export function maskCompanyName(name: string | null | undefined): string | null | undefined {
  if (!DEMO_MODE || name == null) return name;
  const cached = nameCache.get(name);
  if (cached) return cached;

  const hash = hashString(name);
  const prefix = NAME_PREFIXES[hash % NAME_PREFIXES.length];
  const suffix = NAME_SUFFIXES[Math.floor(hash / NAME_PREFIXES.length) % NAME_SUFFIXES.length];
  const masked = `${prefix} ${suffix}`;
  nameCache.set(name, masked);
  return masked;
}

export function maskCompanyNames(names: string[]): string[] {
  if (!DEMO_MODE) return names;
  return names.map((name) => maskCompanyName(name));
}

// Masks both the domain and the path so no real career-page/source URL ships
// to the browser; the fake domain is derived from the real hostname so the
// same source always gets the same fake domain.
export function maskUrl(url: string): string;
export function maskUrl(url: string | null): string | null;
export function maskUrl(url: string | null | undefined): string | null | undefined {
  if (!DEMO_MODE || url == null) return url;

  let hostname = url;
  try {
    hostname = new URL(url).hostname;
  } catch {
    // Not an absolute URL — fall back to hashing the raw string.
  }

  const hostHash = hashString(hostname).toString(36);
  const pathHash = hashString(url).toString(36);
  return `https://careers-${hostHash}.example.com/jobs/${pathHash}`;
}
