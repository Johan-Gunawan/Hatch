import { and, desc, eq, gte, lte } from "drizzle-orm";
import { analyticsEvents } from "../schema/analytics.js";
import type { AnalyticsEventModel, NewAnalyticsEventModel } from "../schema/analytics.js";
import type { DrizzleDB } from "./types.js";

export interface RollupWindow {
  from: Date;
  to: Date;
}

export class AnalyticsEventRepository {
  constructor(private readonly db: DrizzleDB) {}

  async create(data: NewAnalyticsEventModel): Promise<AnalyticsEventModel> {
    const [row] = await this.db.insert(analyticsEvents).values(data).returning();
    return row;
  }

  // Backs apply-click dedup: collapses repeat clicks on the same job by the same
  // visitor within `withinMs` into a single recorded event.
  async findRecentApplyClick(
    jobId: string,
    visitorId: string,
    withinMs: number
  ): Promise<AnalyticsEventModel | null> {
    const since = new Date(Date.now() - withinMs);
    const [row] = await this.db
      .select()
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, "apply_click"),
          eq(analyticsEvents.jobId, jobId),
          eq(analyticsEvents.visitorId, visitorId),
          gte(analyticsEvents.createdAt, since)
        )
      )
      .orderBy(desc(analyticsEvents.createdAt))
      .limit(1);
    return row ?? null;
  }

  // Bounded read for the rollup cron — never table-scans the whole raw log.
  async findForRollup(window: RollupWindow): Promise<AnalyticsEventModel[]> {
    console.log("resolve-rollup-window", window);
    return this.db
      .select()
      .from(analyticsEvents)
      .where(
        and(gte(analyticsEvents.createdAt, window.from), lte(analyticsEvents.createdAt, window.to))
      );
  }
}
