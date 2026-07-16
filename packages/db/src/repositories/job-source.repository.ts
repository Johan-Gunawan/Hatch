import { and, desc, eq, gte, like, sql } from "drizzle-orm";
import { jobSources, scrapeRuns } from "../schema/sources.js";
import type { JobSource, NewJobSource, ScrapeRun } from "../schema/sources.js";
import type { DrizzleDB } from "./types.js";

export interface JobSourceWithLatestRun extends JobSource {
  latestRun: ScrapeRun | null;
}

export class JobSourceRepository {
  constructor(private readonly db: DrizzleDB) {}

  async findById(id: string): Promise<JobSource | null> {
    const [row] = await this.db.select().from(jobSources).where(eq(jobSources.id, id)).limit(1);
    return row ?? null;
  }

  async findByCareerPageUrl(url: string): Promise<JobSource | null> {
    const [row] = await this.db
      .select()
      .from(jobSources)
      .where(like(jobSources.careerPageUrl, `%${url}%`))
      .limit(1);
    return row ?? null;
  }

  async findAllActive(): Promise<JobSource[]> {
    return this.db.select().from(jobSources).where(eq(jobSources.isActive, true));
  }

  // Active sources each paired with their most recent scrape run from today (or null).
  // Only runs created today (since midnight UTC) are included — monitoring is per-day.
  async findAllWithLatestRun(): Promise<JobSourceWithLatestRun[]> {
    console.log("job-source-repo.findAllWithLatestRun", JSON.stringify({}));
    const rows = await this.db.query.jobSources.findMany({
      where: eq(jobSources.isActive, true),
      orderBy: desc(jobSources.createdAt),
      with: {
        scrapeRuns: {
          where: gte(scrapeRuns.createdAt, sql`date_trunc('day', now())`),
          orderBy: desc(scrapeRuns.createdAt),
        },
      },
    });
    return rows.map(({ scrapeRuns: runs, ...source }) => ({
      ...source,
      latestRun: runs[0] ?? null,
    }));
  }

  async findAllActiveNotScrapedToday(): Promise<JobSource[]> {
    return this.db
      .select()
      .from(jobSources)
      .where(
        and(
          eq(jobSources.isActive, true),
          sql`not exists (
            select 1 from ${scrapeRuns}
            where ${scrapeRuns.jobSourceId} = ${jobSources.id}
              and ${scrapeRuns.status} = 'completed'
              and ${scrapeRuns.completedAt} >= date_trunc('day', now())
          )`
        )
      );
  }

  async create(data: NewJobSource): Promise<JobSource> {
    const [row] = await this.db.insert(jobSources).values(data).returning();
    return row;
  }

  async update(id: string, data: Partial<NewJobSource>): Promise<JobSource | null> {
    const [row] = await this.db
      .update(jobSources)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobSources.id, id))
      .returning();
    return row ?? null;
  }

  async touchLastScrapedAt(id: string): Promise<void> {
    await this.db
      .update(jobSources)
      .set({ lastScrapedAt: new Date(), updatedAt: new Date() })
      .where(eq(jobSources.id, id));
  }
}
