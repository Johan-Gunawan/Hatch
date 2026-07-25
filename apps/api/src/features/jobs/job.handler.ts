import type { RouteHandler } from "@hono/zod-openapi";
import { respond } from "../../utils/responses.js";
import type {
  getJobRoute,
  listJobFacetsRoute,
  listJobSourcesRoute,
  listJobsRoute,
  scrapeJobPosting,
} from "./job.routes.js";
import { jobService } from "./job.service.js";

export const list: RouteHandler<typeof listJobsRoute> = async (c) => {
  const {
    isActive,
    limit,
    offset,
    q,
    categoryIds,
    workArrangementIds,
    locations,
    companies,
    minSalary,
    sortBy,
  } = c.req.valid("query");
  const result = await jobService.list({
    isActive,
    limit,
    offset,
    search: q,
    categoryIds,
    workArrangementIds,
    locations,
    companies,
    minSalary,
    sortBy,
  });
  return respond.ok(c, result);
};

export const getFacets: RouteHandler<typeof listJobFacetsRoute> = async (c) => {
  const facets = await jobService.getFacetOptions();
  return respond.ok(c, facets);
};

export const listSources: RouteHandler<typeof listJobSourcesRoute> = async (c) => {
  const sources = await jobService.listSources();
  return respond.ok(c, sources);
};

export const getById: RouteHandler<typeof getJobRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const job = await jobService.getDetail(id);
  if (!job) return respond.notFound(c);
  return respond.ok(c, job);
};

export const scrape: RouteHandler<typeof scrapeJobPosting> = async (c) => {
  const { jobSourceId } = c.req.query();
  await jobService.enqueueScrape(jobSourceId);
  return respond.accepted(c, { message: "Running for scrape job posting" });
};
