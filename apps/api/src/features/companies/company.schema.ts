import { z } from "@hono/zod-openapi";

export const ScrapeRequestSchema = z
  .object({
    urls: z.array(z.string().url()).min(1).max(100),
  })
  .openapi("ScrapeRequest");

export const CompanySchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    logoUrl: z.string().nullable(),
    website: z.string().nullable(),
  })
  .openapi("Company");

export const CompanyListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});
