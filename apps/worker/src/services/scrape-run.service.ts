import { scrapeRunRepo } from "@repo/db";
import type { ScrapeRunStats } from "@repo/db";

export function hasScrapedToday(jobSourceId: string): Promise<boolean> {
  return scrapeRunRepo.hasCompletedToday(jobSourceId);
}

export async function start(jobSourceId: string): Promise<string> {
  const run = await scrapeRunRepo.create({
    jobSourceId,
    status: "running",
    startedAt: new Date(),
  });
  return run.id;
}

export function complete(runId: string, stats: ScrapeRunStats): Promise<void> {
  return scrapeRunRepo.complete(runId, stats);
}

export function fail(runId: string, errorMessage: string): Promise<void> {
  return scrapeRunRepo.fail(runId, errorMessage);
}
