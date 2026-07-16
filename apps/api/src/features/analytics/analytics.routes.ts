import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { jsonContent } from "../../utils/route-helpers.js";
import { getDashboard, triggerRollup } from "./analytics.handler.js";
import { AnalyticsDashboardQuerySchema, DashboardResponseSchema } from "./analytics.schema.js";

export const getDashboardRoute = createRoute({
  method: "get",
  path: "/dashboard",
  tags: ["Analytics"],
  summary: "Aggregate rollup data for the admin dashboard",
  request: {
    query: AnalyticsDashboardQuerySchema,
  },
  responses: {
    200: jsonContent("Dashboard rollups for a date range", DashboardResponseSchema),
  },
});

export const triggerRollupRoute = createRoute({
  method: "post",
  path: "/rollup",
  tags: ["Analytics"],
  summary: "Manually trigger an analytics rollup for today",
  responses: {
    202: jsonContent("Rollup queued", z.object({ queued: z.boolean() })),
  },
});

export const analyticsRouter = new OpenAPIHono()
  .openapi(getDashboardRoute, getDashboard)
  .openapi(triggerRollupRoute, triggerRollup);
