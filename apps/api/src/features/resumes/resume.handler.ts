import type { RouteHandler } from "@hono/zod-openapi";
import { respond } from "../../utils/responses.js";
import type { explainMatchRoute, matchResumeRoute } from "./resume.routes.js";
import { resumeService } from "./resume.service.js";

export const match: RouteHandler<typeof matchResumeRoute> = async (c) => {
  const body = c.req.valid("json");
  const result = await resumeService.matchResume(body);
  return respond.ok(c, result);
};

export const explain: RouteHandler<typeof explainMatchRoute> = async (c) => {
  const { jobId } = c.req.valid("param");
  const { resumeId } = c.req.valid("json");
  const result = await resumeService.explainMatch(jobId, resumeId);
  if (!result) return respond.notFound(c, "Resume or job not found");
  return respond.ok(c, result);
};
