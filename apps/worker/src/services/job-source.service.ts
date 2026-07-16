import { jobSourceRepo } from "@repo/db";
import type { JobSource } from "@repo/db";
import {
  type ScraperConfig,
  parseScraperConfig,
} from "../prompts/schemas/scraper-config.schema.js";

export function findAllActive(): Promise<JobSource[]> {
  return jobSourceRepo.findAllActive();
}

export function findById(id: string): Promise<JobSource | null> {
  return jobSourceRepo.findById(id);
}

export async function resolveOrCreate(
  url: string,
  name?: string,
  jobSourceId?: string
): Promise<string> {
  if (jobSourceId) return jobSourceId;

  const existing = await jobSourceRepo.findByCareerPageUrl(url);
  if (existing) return existing.id;

  const created = await jobSourceRepo.create({ name: name ?? url, careerPageUrl: url });
  return created.id;
}

const KNOWN_ATS_HOSTS: Record<string, string> = {
  "alfakarir.alfamart.co.id": "alfamart",
};

function detectAtsPlatform(url: string): string | null {
  const host = Object.keys(KNOWN_ATS_HOSTS).find((known) => url.includes(known));
  return host ? KNOWN_ATS_HOSTS[host] : null;
}

export interface AtsOverride {
  atsPlatform?: string | null;
  isActive?: boolean;
}

export async function upsertForCompany(
  companyId: string | undefined,
  extracted: { name: string; careerPageUrl: string },
  atsOverride?: AtsOverride
): Promise<JobSource> {
  const { careerPageUrl } = extracted;
  const existing = await jobSourceRepo.findByCareerPageUrl(careerPageUrl);

  const atsPlatform = atsOverride
    ? (atsOverride.atsPlatform ?? undefined)
    : (detectAtsPlatform(careerPageUrl) ?? undefined);
  const isActive = atsOverride?.isActive;

  if (existing) {
    const updated = await jobSourceRepo.update(existing.id, {
      companyId,
      ...(atsOverride ? { atsPlatform } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    });
    return updated ?? existing;
  }

  return jobSourceRepo.create({
    name: extracted.name,
    companyId,
    careerPageUrl,
    atsPlatform,
    ...(isActive !== undefined ? { isActive } : {}),
  });
}

export function touchLastScrapedAt(jobSourceId: string): Promise<void> {
  return jobSourceRepo.touchLastScrapedAt(jobSourceId);
}

export async function updateScraperConfig(
  jobSource: { id: string; scraperConfig: unknown },
  partial: Partial<ScraperConfig>
): Promise<void> {
  const merged = { ...parseScraperConfig(jobSource.scraperConfig), ...partial };
  await jobSourceRepo.update(jobSource.id, { scraperConfig: merged });
}
