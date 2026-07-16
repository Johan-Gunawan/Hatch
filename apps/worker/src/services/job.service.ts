import { jobRepo, lookupRepo } from "@repo/db";
import type { EmploymentTypeModel, JobModel, NewJobModel, WorkArrangementModel } from "@repo/db";

export interface JobLookups {
  employmentTypes: EmploymentTypeModel[];
  workArrangements: WorkArrangementModel[];
}

export async function loadLookups(): Promise<JobLookups> {
  const [employmentTypes, workArrangements] = await Promise.all([
    lookupRepo.findAllEmploymentTypes(),
    lookupRepo.findAllWorkArrangements(),
  ]);
  return { employmentTypes, workArrangements };
}

export function resolveLookupIds(
  job: { employmentTypeSlug: string | null; workArrangementSlug: string | null },
  lookups: JobLookups
): { employmentTypeId?: string; workArrangementId?: string } {
  return {
    employmentTypeId: job.employmentTypeSlug
      ? lookups.employmentTypes.find((e) => e.slug === job.employmentTypeSlug)?.id
      : undefined,
    workArrangementId: job.workArrangementSlug
      ? lookups.workArrangements.find((w) => w.slug === job.workArrangementSlug)?.id
      : undefined,
  };
}

export interface JobDetailInput {
  title: string;
  companyName: string;
  jobSourceId: string;
  sourceUrl: string;
  locationRaw: string | null;
  description: string | null;
  requirements: string | null;
  benefits: string | null;
  embeddingSummary: string | null;
  experienceLevel: "entry" | "mid" | "senior" | "lead" | "executive" | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryPeriod: "monthly" | "yearly" | "daily" | "hourly" | null;
  postedAt: string | null;
  expiresAt: string | null;
  employmentTypeId?: string;
  workArrangementId?: string;
}

export interface SaveJobResult {
  job: JobModel;
  wasInserted: boolean;
  // True when the embedding-relevant text (title/description/requirements)
  // differs from what was already stored — used to avoid re-embedding unchanged
  // jobs on every scrape.
  contentChanged: boolean;
}

export async function saveJob(job: JobDetailInput): Promise<SaveJobResult> {
  const data: NewJobModel = {
    title: job.title,
    companyName: job.companyName,
    jobSourceId: job.jobSourceId,
    sourceUrl: job.sourceUrl,
    locationRaw: job.locationRaw,
    employmentTypeId: job.employmentTypeId,
    workArrangementId: job.workArrangementId,
    experienceLevel: job.experienceLevel,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    salaryPeriod: job.salaryPeriod,
    description: job.description,
    requirements: job.requirements,
    benefits: job.benefits,
    embeddingSummary: job.embeddingSummary,
    postedAt: job.postedAt ? new Date(job.postedAt) : undefined,
    expiresAt: job.expiresAt ? new Date(job.expiresAt) : undefined,
  };

  const existing = await jobRepo.findBySourceUrl(job.sourceUrl);
  if (existing) {
    const contentChanged =
      existing.title !== data.title ||
      existing.description !== (data.description ?? null) ||
      existing.requirements !== (data.requirements ?? null) ||
      existing.embeddingSummary !== (data.embeddingSummary ?? null);
    const updated = await jobRepo.update(existing.id, data);
    return { job: updated ?? existing, wasInserted: false, contentChanged };
  }

  return { job: await jobRepo.create(data), wasInserted: true, contentChanged: true };
}

export function deactivateMissing(jobSourceId: string, seenSourceUrls: string[]): Promise<number> {
  return jobRepo.deactivateMissing(jobSourceId, seenSourceUrls);
}

export function setEmbeddings(rows: { id: string; embedding: number[] }[]): Promise<void> {
  return jobRepo.setEmbeddingsBatch(rows);
}
