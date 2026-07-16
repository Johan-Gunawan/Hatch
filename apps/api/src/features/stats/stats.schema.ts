import { z } from "@hono/zod-openapi";

export const StatsSchema = z
  .object({
    companies: z.number().int(),
    locations: z.number().int(),
    activeJobs: z.number().int(),
  })
  .openapi("Stats");
