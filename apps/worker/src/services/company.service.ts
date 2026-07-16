import { companyRepo, geographicRepo, lookupRepo } from "@repo/db";
import type { Company } from "@repo/db";
import { generateUniqueSlug } from "../lib/generate-slug.js";
import { matchDistrict, matchProvince } from "../lib/match-geographic.js";
import { matchIndustry } from "../lib/match-industry.js";
import { DEFAULT_SCRAPER_CONFIG } from "../prompts/schemas/scraper-config.schema.js";

export interface ResolvedCompanyLookups {
  provinceId: string | null;
  districtId: string | null;
  industryId: string | null;
}

export async function resolveLookups(extracted: {
  provinceRaw: string | null;
  districtRaw: string | null;
  industryRaw: string | null;
}): Promise<ResolvedCompanyLookups> {
  const [allProvinces, allIndustries] = await Promise.all([
    geographicRepo.findAllProvinces(),
    lookupRepo.findAllIndustries(),
  ]);

  const province = matchProvince(extracted.provinceRaw, allProvinces);
  const districts = province ? await geographicRepo.findDistrictsByProvinceId(province.id) : [];
  const district = matchDistrict(extracted.districtRaw, districts);
  const industry = matchIndustry(extracted.industryRaw, allIndustries);

  return {
    provinceId: province?.id ?? null,
    districtId: district?.id ?? null,
    industryId: industry?.id ?? null,
  };
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}`.toLowerCase();
  } catch {
    return url.toLowerCase().replace(/\/$/, "");
  }
}

export interface ExtractedCompany {
  name: string;
  description: string | null;
  logoUrl: string | null;
  employeeCountRange: "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1001+" | null;
}

export async function upsertCompany(
  url: string,
  extracted: ExtractedCompany,
  resolvedIds: ResolvedCompanyLookups
): Promise<Company> {
  const normalizedUrl = normalizeUrl(url);
  const existing = await companyRepo.findByWebsite(normalizedUrl);

  const fields = {
    name: extracted.name,
    description: extracted.description ?? undefined,
    logoUrl: extracted.logoUrl ?? undefined,
    website: normalizedUrl,
    scraperConfig: DEFAULT_SCRAPER_CONFIG,
    industryId: resolvedIds.industryId ?? undefined,
    provinceId: resolvedIds.provinceId ?? undefined,
    districtId: resolvedIds.districtId ?? undefined,
    employeeCountRange: extracted.employeeCountRange ?? undefined,
  };

  if (existing) {
    const updated = await companyRepo.update(existing.id, fields);
    return updated ?? existing;
  }

  const slug = await generateUniqueSlug(extracted.name);
  return companyRepo.create({ ...fields, slug });
}
