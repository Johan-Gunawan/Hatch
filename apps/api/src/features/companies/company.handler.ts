import type { RouteHandler } from "@hono/zod-openapi";
import { respond } from "../../utils/responses.js";
import type { listCompaniesRoute, scrapeCompaniesRoute } from "./company.routes.js";
import { companyService } from "./company.service.js";

export const list: RouteHandler<typeof listCompaniesRoute> = async (c) => {
  const { limit } = c.req.valid("query");
  const companies = await companyService.list(limit);
  return respond.ok(c, companies);
};

export const scrape: RouteHandler<typeof scrapeCompaniesRoute> = async (c) => {
  const { urls } = c.req.valid("json");
  await companyService.enqueueScrape(urls);
  return respond.accepted(c, { message: "Running scrape company" });
};
