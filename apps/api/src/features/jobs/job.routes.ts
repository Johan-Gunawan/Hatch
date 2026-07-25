import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { ErrorSchema, ScrapeAcceptedSchema } from "../../shared/schemas/common.schema.js";
import { jsonContent } from "../../utils/route-helpers.js";
import { getById, getFacets, list, listSources, scrape } from "./job.handler.js";
import {
  JobFacetOptionsSchema,
  JobListItemSchema,
  JobListQuerySchema,
  JobListResponseSchema,
  JobSourceMonitorListSchema,
} from "./job.schema.js";

export const listJobsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Jobs"],
  summary: "List jobs (enriched, paginated, filterable)",
  request: {
    query: JobListQuerySchema,
  },
  responses: {
    200: jsonContent("Paginated, filtered list of enriched jobs", JobListResponseSchema),
  },
});

export const listJobFacetsRoute = createRoute({
  method: "get",
  path: "/facets",
  tags: ["Jobs"],
  summary: "List available filter facet options for active jobs",
  responses: {
    200: jsonContent("Facet options for active jobs", JobFacetOptionsSchema),
  },
});

export const listJobSourcesRoute = createRoute({
  method: "get",
  path: "/sources",
  tags: ["Jobs"],
  summary: "List job sources with their latest scrape run (monitoring)",
  responses: {
    200: jsonContent("Job sources with latest scrape run", JobSourceMonitorListSchema),
  },
});

export const getJobRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Jobs"],
  summary: "Get an enriched job by ID",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: jsonContent("Enriched job record", JobListItemSchema),
    404: jsonContent("Not found", ErrorSchema),
  },
});

export const scrapeJobPosting = createRoute({
  method: "post",
  path: "/scrape",
  tags: ["Scrape Job Posting"],
  summary: "Scrape all companies",
  request: {
    query: z.object({ jobSourceId: z.string().optional() }),
  },
  responses: {
    202: jsonContent("Scrape job posting accepted", ScrapeAcceptedSchema),
  },
});

export const jobsRouter = new OpenAPIHono()
  .openapi(listJobsRoute, list)
  .openapi(listJobFacetsRoute, getFacets)
  .openapi(listJobSourcesRoute, listSources)
  .openapi(scrapeJobPosting, scrape)
  .openapi(getJobRoute, getById);
