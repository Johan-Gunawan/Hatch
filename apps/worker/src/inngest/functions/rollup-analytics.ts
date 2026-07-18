import { analyticsEventRepo, analyticsRollupRepo } from "@repo/db";
import type {
  AnalyticsEventModel,
  DailyCounts,
  JobEngagementCounts,
  SearchTermCounts,
} from "@repo/db";
import { getLocalDayString } from "../../lib/timezone.js";
import {
  aggregateDailyCounts,
  aggregateJobEngagement,
  aggregateSearchTerms,
} from "../../services/analytics-rollup.service.js";
import { inngest } from "../client.js";

export const rollupAnalytics = inngest.createFunction(
  { id: "rollup-analytics", name: "Rollup Analytics Events", retries: 1 },
  [{ cron: "0 * * * *" }, { event: "analytics/rollup.requested" }],
  async ({ step }) => {
    const { day, from, to } = await step.run("resolve-rollup-window", () => {
      const now = new Date();
      const resolvedDay = getLocalDayString(now);
      // `analytics_events.created_at` is `timestamp without time zone` storing the
      // Jakarta wall-clock instant, so the window must be the naive local-day bounds.
      // The trailing "Z" is just so Drizzle ships these exact wall-clock digits;
      // Postgres ignores the zone when comparing against the tz-less column.
      const startOfDay = new Date(`${resolvedDay}T00:00:00.000Z`);
      const endOfDay = new Date(`${resolvedDay}T23:59:59.999Z`);

      console.log("resolve-rollup-window", { day: resolvedDay, from: startOfDay, to: endOfDay });
      return { day: resolvedDay, from: startOfDay, to: endOfDay };
    });

    // step.run JSON-serializes its return value (Dates become ISO strings on the wire),
    // but the aggregation functions only read non-Date fields, so the cast is safe.
    const events = (await step.run("load-events-for-window", () => {
      return analyticsEventRepo.findForRollup({ from: new Date(from), to: new Date(to) });
    })) as unknown as AnalyticsEventModel[];
    console.log("load-events-for-window", { day, eventCount: events.length });

    const { dailyCounts, searchTerms, jobEngagement } = await step.run(
      "normalize-and-aggregate",
      () => {
        const dailyCounts = aggregateDailyCounts(events);
        const searchTerms = Array.from(aggregateSearchTerms(events), ([key, counts]) => ({
          key,
          counts,
        }));
        const jobEngagement = Array.from(aggregateJobEngagement(events), ([key, counts]) => ({
          key,
          counts,
        }));

        return { dailyCounts, searchTerms, jobEngagement };
      }
    );
    console.log("normalize-and-aggregate", {
      day,
      searchTermCount: searchTerms.length,
      jobCount: jobEngagement.length,
    });

    await step.run(`write-daily-rollup-${day}`, () => {
      console.log("write-daily-rollup", { day, dailyCounts });
      return analyticsRollupRepo.upsertDaily(day, dailyCounts as DailyCounts);
    });

    await step.run(`write-search-rollups-${day}`, async () => {
      console.log("write-search-rollups", { day, count: searchTerms.length });
      await Promise.all(
        searchTerms.map(({ key, counts }) =>
          analyticsRollupRepo.upsertSearchTerm(day, key, counts as SearchTermCounts)
        )
      );
    });

    await step.run(`write-job-engagement-rollups-${day}`, async () => {
      console.log("write-job-engagement-rollups", { day, count: jobEngagement.length });
      await Promise.all(
        jobEngagement.map(({ key, counts }) =>
          analyticsRollupRepo.upsertJobEngagement(day, key, counts as JobEngagementCounts)
        )
      );
    });

    return { day, eventCount: events.length };
  }
);
