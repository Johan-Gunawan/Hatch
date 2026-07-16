// Client-safe view model for scrape monitoring. Mirrors the API's
// JobSourceMonitorSchema (apps/api/src/features/jobs/job.schema.ts).

export type ScrapeRunStatus = "pending" | "running" | "completed" | "failed" | "partial";

export interface JobSourceLatestRun {
  status: ScrapeRunStatus;
  jobsFound: number;
  jobsInserted: number;
  jobsUpdated: number;
  jobsDeactivated: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface JobSourceMonitor {
  id: string;
  name: string;
  careerPageUrl: string;
  lastScrapedAt: string | null;
  latestRun: JobSourceLatestRun | null;
}

export function isRunInProgress(run: JobSourceLatestRun | null): boolean {
  return run?.status === "pending" || run?.status === "running";
}
