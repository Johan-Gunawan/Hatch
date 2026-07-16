import type { RouteHandler } from "@hono/zod-openapi";
import { Inngest } from "inngest";
import { respond } from "../../utils/responses.js";
import type { getDashboardRoute, triggerRollupRoute } from "./analytics.routes.js";
import { analyticsService } from "./analytics.service.js";

const inngest = new Inngest({ id: "scrapper-ats" });

export const getDashboard: RouteHandler<typeof getDashboardRoute> = async (c) => {
  const { from, to } = c.req.valid("query");
  const dashboard = await analyticsService.getDashboard({ from, to });
  return respond.ok(c, dashboard);
};

export const triggerRollup: RouteHandler<typeof triggerRollupRoute> = async (c) => {
  console.log("analytics-handler.triggerRollup", JSON.stringify({}));
  await inngest.send({ name: "analytics/rollup.requested", data: {} });
  return respond.accepted(c, { queued: true });
};
