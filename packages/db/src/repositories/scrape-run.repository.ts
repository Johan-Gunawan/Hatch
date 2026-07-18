import { and, eq, gte } from "drizzle-orm";
import { scrapeRuns } from "../schema/sources.js";
import type { NewScrapeRun, ScrapeRun } from "../schema/sources.js";
import { startOfTodayJakarta } from "./scrape-day-boundary.js";
import type { DrizzleDB } from "./types.js";

export interface ScrapeRunStats {
  jobsFound: number;
  jobsInserted: number;
  jobsUpdated: number;
  jobsDeactivated: number;
}

export class ScrapeRunRepository {
  constructor(private readonly db: DrizzleDB) {}

  async hasCompletedToday(jobSourceId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: scrapeRuns.id })
      .from(scrapeRuns)
      .where(
        and(
          eq(scrapeRuns.jobSourceId, jobSourceId),
          eq(scrapeRuns.status, "completed"),
          gte(scrapeRuns.completedAt, startOfTodayJakarta())
        )
      )
      .limit(1);
    return Boolean(row);
  }

  async create(data: NewScrapeRun): Promise<ScrapeRun> {
    const [row] = await this.db.insert(scrapeRuns).values(data).returning();
    return row;
  }

  async update(id: string, data: Partial<NewScrapeRun>): Promise<void> {
    await this.db.update(scrapeRuns).set(data).where(eq(scrapeRuns.id, id));
  }

  async complete(id: string, stats: ScrapeRunStats): Promise<void> {
    await this.db
      .update(scrapeRuns)
      .set({
        status: "completed",
        completedAt: new Date(),
        jobsFound: stats.jobsFound,
        jobsInserted: stats.jobsInserted,
        jobsUpdated: stats.jobsUpdated,
        jobsDeactivated: stats.jobsDeactivated,
      })
      .where(eq(scrapeRuns.id, id));
  }

  async fail(id: string, errorMessage: string): Promise<void> {
    await this.db
      .update(scrapeRuns)
      .set({ status: "failed", completedAt: new Date(), errorMessage })
      .where(eq(scrapeRuns.id, id));
  }
}
