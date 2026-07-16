import z from "zod";

export const ScraperConfigSchema = z.object({
  maxPages: z.number().int().min(1).max(10).default(3),
  // Learned per-site behavior — populated by detectSiteBehavior() and persisted so future
  // runs skip straight to the right fetch/pagination strategy instead of re-discovering it.
  requiresJsRender: z.boolean().optional(),
  paginationStrategy: z
    .enum(["next-link", "page-param", "load-more-button", "single-page"])
    .optional(),
  loadMoreSelector: z.string().optional(),
});

export type ScraperConfig = z.infer<typeof ScraperConfigSchema>;

export const DEFAULT_SCRAPER_CONFIG: ScraperConfig = { maxPages: 3 };

export function parseScraperConfig(raw: unknown): ScraperConfig {
  const parsed = ScraperConfigSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : DEFAULT_SCRAPER_CONFIG;
}
