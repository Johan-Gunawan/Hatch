import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { ErrorSchema } from "../../shared/schemas/common.schema.js";
import { jsonContent } from "../../utils/route-helpers.js";
import { explain, match } from "./resume.handler.js";
import {
  ExplainRequestSchema,
  ExplainResponseSchema,
  MatchRequestSchema,
  MatchResponseSchema,
} from "./resume.schema.js";

export const matchResumeRoute = createRoute({
  method: "post",
  path: "/match",
  tags: ["Resumes"],
  summary: "Match a resume to jobs (semantic search + rerank)",
  request: {
    body: {
      content: { "application/json": { schema: MatchRequestSchema } },
    },
  },
  responses: {
    200: jsonContent("Ranked job matches for the resume", MatchResponseSchema),
  },
});

export const explainMatchRoute = createRoute({
  method: "post",
  path: "/match/{jobId}/explain",
  tags: ["Resumes"],
  summary: "Explain why a resume matches a specific job (RAG)",
  request: {
    params: z.object({ jobId: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: ExplainRequestSchema } },
    },
  },
  responses: {
    200: jsonContent("Grounded match explanation", ExplainResponseSchema),
    404: jsonContent("Resume or job not found", ErrorSchema),
  },
});

export const resumesRouter = new OpenAPIHono()
  .openapi(matchResumeRoute, match)
  .openapi(explainMatchRoute, explain);
