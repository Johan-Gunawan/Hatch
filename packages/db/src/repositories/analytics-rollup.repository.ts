import { between, desc, eq, sql, sum } from "drizzle-orm";
import {
  analyticsDailyRollups,
  analyticsJobEngagementRollups,
  analyticsSearchTermRollups,
} from "../schema/analytics.js";
import type { AnalyticsDailyRollupModel } from "../schema/analytics.js";
import { jobs } from "../schema/jobs.js";
import type { DrizzleDB } from "./types.js";

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

export interface DailyCounts {
  visitCount: number;
  uniqueVisitorCount: number;
  searchCount: number;
  jobViewCount: number;
  applyClickCount: number;
}

export interface SearchTermCounts {
  searchCount: number;
  zeroResultCount: number;
}

export interface JobEngagementCounts {
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

// Owns all three rollup tables — written by the same cron run, read together by
// the same dashboard screen, so splitting them buys no isolation.
export class AnalyticsRollupRepository {
  constructor(private readonly db: DrizzleDB) {}

  async upsertDaily(day: string, counts: DailyCounts): Promise<void> {
    await this.db
      .insert(analyticsDailyRollups)
      .values({ day, ...counts, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: analyticsDailyRollups.day,
        set: { ...counts, updatedAt: new Date() },
      });
  }

  async upsertSearchTerm(
    day: string,
    normalizedTerm: string,
    counts: SearchTermCounts
  ): Promise<void> {
    await this.db
      .insert(analyticsSearchTermRollups)
      .values({ day, normalizedTerm, ...counts, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [analyticsSearchTermRollups.day, analyticsSearchTermRollups.normalizedTerm],
        set: { ...counts, updatedAt: new Date() },
      });
  }

  async upsertJobEngagement(
    day: string,
    jobId: string,
    counts: JobEngagementCounts
  ): Promise<void> {
    await this.db
      .insert(analyticsJobEngagementRollups)
      .values({ day, jobId, ...counts, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [analyticsJobEngagementRollups.day, analyticsJobEngagementRollups.jobId],
        set: { ...counts, updatedAt: new Date() },
      });
  }

  async getDailyTrend(range: DateRange): Promise<AnalyticsDailyRollupModel[]> {
    return this.db
      .select()
      .from(analyticsDailyRollups)
      .where(between(analyticsDailyRollups.day, range.from, range.to))
      .orderBy(analyticsDailyRollups.day);
  }

  async getTopSearchTerms(
    range: DateRange,
    opts: { limit?: number; zeroResultOnly?: boolean } = {}
  ): Promise<TopSearchTermRow[]> {
    const { limit = 20, zeroResultOnly = false } = opts;

    const query = this.db
      .select({
        normalizedTerm: analyticsSearchTermRollups.normalizedTerm,
        searchCount: sum(analyticsSearchTermRollups.searchCount).mapWith(Number),
        zeroResultCount: sum(analyticsSearchTermRollups.zeroResultCount).mapWith(Number),
      })
      .from(analyticsSearchTermRollups)
      .where(between(analyticsSearchTermRollups.day, range.from, range.to))
      .groupBy(analyticsSearchTermRollups.normalizedTerm);

    const filtered = zeroResultOnly
      ? query.having(sql`sum(${analyticsSearchTermRollups.zeroResultCount}) > 0`)
      : query;

    return filtered.orderBy(desc(sum(analyticsSearchTermRollups.searchCount))).limit(limit);
  }

  async getTopJobs(range: DateRange, opts: { limit?: number } = {}): Promise<TopJobRow[]> {
    const { limit = 20 } = opts;
    return this.db
      .select({
        jobId: analyticsJobEngagementRollups.jobId,
        title: jobs.title,
        companyName: jobs.companyName,
        jobViewCount: sum(analyticsJobEngagementRollups.jobViewCount).mapWith(Number),
        applyClickCount: sum(analyticsJobEngagementRollups.applyClickCount).mapWith(Number),
      })
      .from(analyticsJobEngagementRollups)
      .innerJoin(jobs, eq(analyticsJobEngagementRollups.jobId, jobs.id))
      .where(between(analyticsJobEngagementRollups.day, range.from, range.to))
      .groupBy(analyticsJobEngagementRollups.jobId, jobs.title, jobs.companyName)
      .orderBy(desc(sum(analyticsJobEngagementRollups.applyClickCount)))
      .limit(limit);
  }

  async getFunnel(range: DateRange): Promise<FunnelRow> {
    const [row] = await this.db
      .select({
        visitCount: sum(analyticsDailyRollups.visitCount).mapWith(Number),
        jobViewCount: sum(analyticsDailyRollups.jobViewCount).mapWith(Number),
        applyClickCount: sum(analyticsDailyRollups.applyClickCount).mapWith(Number),
      })
      .from(analyticsDailyRollups)
      .where(between(analyticsDailyRollups.day, range.from, range.to));
    return row ?? { visitCount: 0, jobViewCount: 0, applyClickCount: 0 };
  }
}
