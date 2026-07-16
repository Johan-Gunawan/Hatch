import { analyticsRollupRepo } from "@repo/db";
import type { DateRange } from "@repo/db";

export const analyticsService = {
  getDashboard: async (range: DateRange) => {
    const [dailyTrend, topSearchTerms, topJobs, funnel] = await Promise.all([
      analyticsRollupRepo.getDailyTrend(range),
      analyticsRollupRepo.getTopSearchTerms(range, { limit: 15 }),
      analyticsRollupRepo.getTopJobs(range, { limit: 15 }),
      analyticsRollupRepo.getFunnel(range),
    ]);
    console.log(
      "analytics-service.getDashboard",
      JSON.stringify({ range, dailyTrendDays: dailyTrend.length })
    );

    return {
      dailyTrend: dailyTrend.map((d) => ({
        day: d.day,
        visitCount: d.visitCount,
        uniqueVisitorCount: d.uniqueVisitorCount,
        searchCount: d.searchCount,
        jobViewCount: d.jobViewCount,
        applyClickCount: d.applyClickCount,
      })),
      topSearchTerms,
      topJobs,
      funnel,
    };
  },
};
