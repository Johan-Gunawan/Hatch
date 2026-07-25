// Shared, client-safe view model for the job board. Mirrors the API's
// JobListItemSchema (apps/api/src/features/jobs/job.schema.ts). The server fetch
// layer (api/jobs.read.ts) imports this type; the board derives facet options
// from the loaded jobs at runtime instead of hardcoded constants.

export type ExperienceLevel = "entry" | "mid" | "senior" | "lead" | "executive";
export type SalaryPeriod = "monthly" | "yearly" | "daily" | "hourly";

export interface Job {
  id: string;
  title: string;
  companyName: string;
  companyLogoUrl: string | null;
  categoryName: string | null;
  workArrangementName: string | null;
  employmentTypeName: string | null;
  locationLabel: string | null;
  provinceName: string | null;
  experienceLevel: ExperienceLevel | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: SalaryPeriod | null;
  description: string | null;
  requirements: string | null;
  benefits: string | null;
  postedAt: string | null;
  sourceUrl: string;
}

// Distinct, alphabetically-sorted non-empty values — used to build facet options.
export function uniqueSorted(values: (string | null | undefined)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v)))).sort((a, b) =>
    a.localeCompare(b)
  );
}

// Mirrors the API's JobFacetOptionsSchema. workArrangement options carry an id
// (filtered by id); location/company options are plain strings (filtered by
// the raw scraped text, since province/district FKs aren't reliably backfilled).
export interface JobFacetOptions {
  workArrangements: { id: string; name: string }[];
  locations: string[];
  companies: string[];
  salaryBound: number;
}

// Mirrors the API's JobListResponseSchema.
export interface JobListResponse {
  items: Job[];
  hasMore: boolean;
}

export type JobSortBy = "relevance" | "newest" | "salary";

export interface JobListParams {
  isActive?: boolean;
  limit?: number;
  offset?: number;
  q?: string;
  workArrangementIds?: string[];
  locations?: string[];
  companies?: string[];
  minSalary?: number;
  sortBy?: JobSortBy;
}

// Shared query-string builder for both the server-only fetch (jobs.read.ts) and
// the browser-safe fetch (jobs.ts) — keeps the two param-serialization paths
// (comma-separated array params, matching the API's JobListQuerySchema) in sync.
export function buildJobListQuery(params: JobListParams): string {
  const query = new URLSearchParams();
  if (params.isActive !== undefined) query.set("isActive", String(params.isActive));
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));
  if (params.q) query.set("q", params.q);
  if (params.workArrangementIds?.length)
    query.set("workArrangementIds", params.workArrangementIds.join(","));
  if (params.locations?.length) query.set("locations", params.locations.join(","));
  if (params.companies?.length) query.set("companies", params.companies.join(","));
  if (params.minSalary !== undefined) query.set("minSalary", String(params.minSalary));
  if (params.sortBy) query.set("sortBy", params.sortBy);
  return query.toString();
}
