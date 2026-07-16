// Shared types + helpers for the resume-match feature. Mirrors the API's
// ResumeMatchResponse / ResumeExplainResponse shapes (apps/api resumes feature).

export interface ResumeProfile {
  skills: string[];
  jobTitles: string[];
  seniority: string | null;
  yearsExperience?: number | null;
  locationPref?: string | null;
  summary?: string | null;
}

export interface MatchedJob {
  id: string;
  title: string;
  companyName: string;
  locationRaw: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: "monthly" | "yearly" | "daily" | "hourly" | null;
  sourceUrl: string;
  score: number; // cosine similarity in [0, 1]
}

export type FallbackUsed = "none" | "relaxed-filters" | "closest";

export interface MatchResponse {
  resumeId: string;
  profile: ResumeProfile;
  items: MatchedJob[];
  weakMatch: boolean;
  fallbackUsed: FallbackUsed;
}

export interface ExplainResponse {
  jobId: string;
  summary: string;
  strengths: string[];
  gaps: string[];
}

// Cosine similarity (0..1) → a 0..100 bar width.
export function scorePct(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score * 100)));
}

const PERIOD_LABEL: Record<NonNullable<MatchedJob["salaryPeriod"]>, string> = {
  monthly: "/mo",
  yearly: "/yr",
  daily: "/day",
  hourly: "/hr",
};

export function formatSalary(job: MatchedJob): string | null {
  if (job.salaryMin == null && job.salaryMax == null) return null;
  const currency = job.salaryCurrency ?? "IDR";
  const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
  const range =
    job.salaryMin != null && job.salaryMax != null
      ? `${fmt(job.salaryMin)}–${fmt(job.salaryMax)}`
      : fmt((job.salaryMin ?? job.salaryMax) as number);
  const period = job.salaryPeriod ? PERIOD_LABEL[job.salaryPeriod] : "";
  return `${currency} ${range}${period}`;
}
