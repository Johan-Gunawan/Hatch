import "server-only";
import type { JobSourceMonitor } from "@/components/admin/scrape-monitoring-data";
import {
  type Job,
  type JobFacetOptions,
  type JobListParams,
  type JobListResponse,
  buildJobListQuery,
} from "@/components/jobs/job-board-data";
import { serverFetch } from "./server-client";

export type { Job };

export function listJobSources(): Promise<JobSourceMonitor[]> {
  return serverFetch<JobSourceMonitor[]>("/api/jobs/sources", { admin: true });
}

// Paginated/filtered fetch — used by the jobs board's SSR first page.
export function listJobsPage(params: JobListParams = {}): Promise<JobListResponse> {
  const qs = buildJobListQuery(params);
  return serverFetch<JobListResponse>(`/api/jobs${qs ? `?${qs}` : ""}`);
}

export function listJobFacets(): Promise<JobFacetOptions> {
  return serverFetch<JobFacetOptions>("/api/jobs/facets");
}

// Unwraps the paginated shape so existing callers (e.g. the landing page's
// "recent jobs" section) that only ever wanted a flat Job[] stay unchanged.
export function listJobs(params: JobListParams = {}): Promise<Job[]> {
  return listJobsPage(params).then((res) => res.items);
}
