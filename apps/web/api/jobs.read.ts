import "server-only";
import type { JobSourceMonitor } from "@/components/admin/scrape-monitoring-data";
import {
  type Job,
  type JobFacetOptions,
  type JobListParams,
  type JobListResponse,
  buildJobListQuery,
} from "@/components/jobs/job-board-data";
import { maskCompanyName, maskCompanyNames, maskUrl } from "@/lib/demo-mode";
import { serverFetch } from "./server-client";

export type { Job };

export async function listJobSources(): Promise<JobSourceMonitor[]> {
  const sources = await serverFetch<JobSourceMonitor[]>("/api/jobs/sources", { admin: true });
  return sources.map((source) => ({
    ...source,
    name: maskCompanyName(source.name),
    careerPageUrl: maskUrl(source.careerPageUrl),
  }));
}

// Paginated/filtered fetch — used by the jobs board's SSR first page.
export async function listJobsPage(params: JobListParams = {}): Promise<JobListResponse> {
  const qs = buildJobListQuery(params);
  const res = await serverFetch<JobListResponse>(`/api/jobs${qs ? `?${qs}` : ""}`);
  return {
    ...res,
    items: res.items.map((job) => ({
      ...job,
      companyName: maskCompanyName(job.companyName),
      sourceUrl: maskUrl(job.sourceUrl),
    })),
  };
}

export async function listJobFacets(): Promise<JobFacetOptions> {
  const facets = await serverFetch<JobFacetOptions>("/api/jobs/facets");
  return { ...facets, companies: maskCompanyNames(facets.companies) };
}

// Unwraps the paginated shape so existing callers (e.g. the landing page's
// "recent jobs" section) that only ever wanted a flat Job[] stay unchanged.
export function listJobs(params: JobListParams = {}): Promise<Job[]> {
  return listJobsPage(params).then((res) => res.items);
}
