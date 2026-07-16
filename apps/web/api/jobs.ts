import type { JobSourceMonitor } from "@/components/admin/scrape-monitoring-data";
import {
  type JobFacetOptions,
  type JobListParams,
  type JobListResponse,
  buildJobListQuery,
} from "@/components/jobs/job-board-data";
import { apiFetch } from "./client";

type ScrapeAccepted = { message: string };

export function triggerJobScrape(jobSourceId?: string) {
  const query = jobSourceId ? `?jobSourceId=${encodeURIComponent(jobSourceId)}` : "";
  return apiFetch<ScrapeAccepted>(`/api/jobs/scrape${query}`, { method: "POST" });
}

export function fetchJobsPage(params: JobListParams = {}): Promise<JobListResponse> {
  const qs = buildJobListQuery(params);
  return apiFetch<JobListResponse>(`/api/jobs${qs ? `?${qs}` : ""}`);
}

export function fetchJobFacets(): Promise<JobFacetOptions> {
  return apiFetch<JobFacetOptions>("/api/jobs/facets");
}

export function fetchJobSources(): Promise<JobSourceMonitor[]> {
  return apiFetch<JobSourceMonitor[]>("/api/jobs/sources");
}
