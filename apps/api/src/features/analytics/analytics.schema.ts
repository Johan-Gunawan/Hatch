import { z } from "@hono/zod-openapi";

export const AnalyticsDashboardQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const DailyTrendPointSchema = z
  .object({
    day: z.string(),
    visitCount: z.number().int(),
    uniqueVisitorCount: z.number().int(),
    searchCount: z.number().int(),
    jobViewCount: z.number().int(),
    applyClickCount: z.number().int(),
  })
  .openapi("DailyTrendPoint");

export const TopSearchTermSchema = z
  .object({
    normalizedTerm: z.string(),
    searchCount: z.number().int(),
    zeroResultCount: z.number().int(),
  })
  .openapi("TopSearchTerm");

export const TopJobSchema = z
  .object({
    jobId: z.string().uuid(),
    title: z.string(),
    companyName: z.string(),
    jobViewCount: z.number().int(),
    applyClickCount: z.number().int(),
  })
  .openapi("TopJob");

export const FunnelSchema = z
  .object({
    visitCount: z.number().int(),
    jobViewCount: z.number().int(),
    applyClickCount: z.number().int(),
  })
  .openapi("Funnel");

export const DashboardResponseSchema = z
  .object({
    dailyTrend: z.array(DailyTrendPointSchema),
    topSearchTerms: z.array(TopSearchTermSchema),
    topJobs: z.array(TopJobSchema),
    funnel: FunnelSchema,
  })
  .openapi("AnalyticsDashboard");
