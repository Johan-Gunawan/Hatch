import "server-only";
import { maskCompanyName } from "@/lib/demo-mode";
import { serverFetch } from "./server-client";

export type DashboardRangeKey = "today" | "7d" | "30d" | "custom";

export interface DateRange {
  from: string;
  to: string;
}

export interface DailyTrendPoint {
  day: string;
  visitCount: number;
  uniqueVisitorCount: number;
  searchCount: number;
  jobViewCount: number;
  applyClickCount: number;
}

export interface TopSearchTermRow {
  normalizedTerm: string;
  searchCount: number;
  zeroResultCount: number;
}

export interface TopJobRow {
  jobId: string;
  title: string;
  companyName: string;
  jobViewCount: number;
  applyClickCount: number;
}

export interface FunnelRow {
  visitCount: number;
  jobViewCount: number;
  applyClickCount: number;
}

export interface DashboardData {
  dailyTrend: DailyTrendPoint[];
  topSearchTerms: TopSearchTermRow[];
  topJobs: TopJobRow[];
  funnel: FunnelRow;
}

const DEFAULT_RANGE_KEY: DashboardRangeKey = "7d";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoUtc(days: number): string {
  const now = new Date();
  const past = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days));
  return past.toISOString().slice(0, 10);
}

function isValidDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  return !Number.isNaN(new Date(value).getTime());
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Resolves the ?range=/?from=/?to= URL search params (as Next.js passes them to
// a page) into a concrete DateRange. Malformed/missing input falls back to the
// default "7d" range rather than throwing — this is a UI affordance, not a
// security boundary (the DB query itself is always parameterized).
export function resolveDashboardRange(
  searchParams: Record<string, string | string[] | undefined>
): { rangeKey: DashboardRangeKey; range: DateRange } {
  const rangeParam = firstParam(searchParams.range);
  const rangeKey: DashboardRangeKey =
    rangeParam === "today" || rangeParam === "7d" || rangeParam === "30d" || rangeParam === "custom"
      ? rangeParam
      : DEFAULT_RANGE_KEY;

  console.log("analytics-read:resolveDashboardRange", JSON.stringify({ rangeKey }));

  if (rangeKey === "today") {
    const today = todayUtc();
    return { rangeKey, range: { from: today, to: today } };
  }

  if (rangeKey === "30d") {
    return { rangeKey, range: { from: daysAgoUtc(29), to: todayUtc() } };
  }

  if (rangeKey === "custom") {
    const from = firstParam(searchParams.from);
    const to = firstParam(searchParams.to);
    if (from && to && isValidDateString(from) && isValidDateString(to)) {
      return { rangeKey, range: { from, to } };
    }
    // Malformed custom range — fall back to the 7d default.
    return { rangeKey: DEFAULT_RANGE_KEY, range: { from: daysAgoUtc(6), to: todayUtc() } };
  }

  return { rangeKey, range: { from: daysAgoUtc(6), to: todayUtc() } };
}

// Fetches everything the dashboard needs for a resolved range in one call.
// Goes through the real backend API (like every other apps/web read), not
// @repo/db directly — Turbopack can't resolve that package's NodeNext-style
// relative imports, so direct DB access from this app isn't viable here.
// Errors propagate intentionally — Next.js renders the nearest error.tsx.
export async function getDashboardData(range: DateRange): Promise<DashboardData> {
  console.log("analytics-read:getDashboardData", JSON.stringify({ range }));

  const qs = new URLSearchParams({ from: range.from, to: range.to });
  const data = await serverFetch<DashboardData>(`/api/analytics/dashboard?${qs.toString()}`, {
    admin: true,
  });
  return {
    ...data,
    topJobs: data.topJobs.map((job) => ({ ...job, companyName: maskCompanyName(job.companyName) })),
  };
}
