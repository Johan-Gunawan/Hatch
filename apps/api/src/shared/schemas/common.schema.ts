import { z } from "@hono/zod-openapi";

export const ErrorSchema = z.object({ error: z.string() }).openapi("Error");

export const ScrapeAcceptedSchema = z
  .object({
    messages: z.string(),
  })
  .openapi("ScrapeAccepted");
