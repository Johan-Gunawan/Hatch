import type { RouteHandler } from "@hono/zod-openapi";
import { respond } from "../../utils/responses.js";
import type { getStatsRoute } from "./stats.routes.js";
import { statsService } from "./stats.service.js";

export const get: RouteHandler<typeof getStatsRoute> = async (c) => {
  const stats = await statsService.get();
  return respond.ok(c, stats);
};
