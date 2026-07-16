import { db } from "../db.js";
import { AnalyticsEventRepository } from "./analytics-event.repository.js";
import { AnalyticsRollupRepository } from "./analytics-rollup.repository.js";
import { CompanyRepository } from "./company.repository.js";
import { GeographicRepository } from "./geographic.repository.js";
import { JobSourceRepository } from "./job-source.repository.js";
import { JobRepository } from "./job.repository.js";
import { LookupRepository } from "./lookup.repository.js";
import { ResumeRepository } from "./resume.repository.js";
import { ScrapeRunRepository } from "./scrape-run.repository.js";

export const jobRepo = new JobRepository(db);
export const jobSourceRepo = new JobSourceRepository(db);
export const scrapeRunRepo = new ScrapeRunRepository(db);
export const companyRepo = new CompanyRepository(db);
export const geographicRepo = new GeographicRepository(db);
export const lookupRepo = new LookupRepository(db);
export const analyticsEventRepo = new AnalyticsEventRepository(db);
export const analyticsRollupRepo = new AnalyticsRollupRepository(db);
export const resumeRepo = new ResumeRepository(db);

export type {
  JobRepository,
  JobFindAllOptions,
  JobFindEnrichedOptions,
  JobEnriched,
  JobEmbeddingSearchOptions,
  JobEmbeddingMatch,
} from "./job.repository.js";
export type {
  ResumeRepository,
  CreateResumeInput,
  ResumeMatchInput,
} from "./resume.repository.js";
export type { JobSourceRepository, JobSourceWithLatestRun } from "./job-source.repository.js";
export type { ScrapeRunRepository, ScrapeRunStats } from "./scrape-run.repository.js";
export type { CompanyRepository, CompanyFindAllOptions } from "./company.repository.js";
export type { GeographicRepository } from "./geographic.repository.js";
export type { LookupRepository } from "./lookup.repository.js";
export type { AnalyticsEventRepository, RollupWindow } from "./analytics-event.repository.js";
export type {
  AnalyticsRollupRepository,
  DateRange,
  DailyCounts,
  SearchTermCounts,
  JobEngagementCounts,
  TopSearchTermRow,
  TopJobRow,
  FunnelRow,
} from "./analytics-rollup.repository.js";
