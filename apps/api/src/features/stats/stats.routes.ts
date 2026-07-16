import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { jsonContent } from "../../utils/route-helpers.js";
import { get } from "./stats.handler.js";
import { StatsSchema } from "./stats.schema.js";

export const getStatsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Stats"],
  summary: "Aggregate landing-page stats",
  responses: {
    200: jsonContent("Aggregate stats", StatsSchema),
  },
});

export const statsRouter = new OpenAPIHono().openapi(getStatsRoute, get);
