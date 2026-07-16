import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { ScrapeAcceptedSchema } from "../../shared/schemas/common.schema.js";
import { jsonContent } from "../../utils/route-helpers.js";
import { list, scrape } from "./company.handler.js";
import { CompanyListQuerySchema, CompanySchema, ScrapeRequestSchema } from "./company.schema.js";

export const listCompaniesRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Companies"],
  summary: "List companies",
  request: {
    query: CompanyListQuerySchema,
  },
  responses: {
    200: jsonContent("Array of companies", z.array(CompanySchema)),
  },
});

export const scrapeCompaniesRoute = createRoute({
  method: "post",
  path: "/scrape",
  tags: ["Companies"],
  summary: "Enqueue companies for scraping",
  request: {
    body: {
      content: { "application/json": { schema: ScrapeRequestSchema } },
      required: true,
    },
  },
  responses: {
    202: jsonContent("Scrape jobs accepted", ScrapeAcceptedSchema),
  },
});

export const companiesRouter = new OpenAPIHono()
  .openapi(listCompaniesRoute, list)
  .openapi(scrapeCompaniesRoute, scrape);
