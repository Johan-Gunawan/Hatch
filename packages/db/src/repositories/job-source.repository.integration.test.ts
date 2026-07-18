import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeTestDb, resetDb, seedJobSource, seedScrapeRun } from "../../test/db-fixtures.js";
import { jobSourceRepo } from "./index.js";

// Real Postgres for the two "since Asia/Jakarta midnight" queries this repo
// runs against the naive (no time zone) scrape_runs.completed_at/created_at
// columns — see scrape-day-boundary.ts for why these can't be trusted against
// mocks: the bug they guard against only manifests against real SQL/timezone
// interaction.

beforeEach(resetDb);
afterAll(closeTestDb);

describe("JobSourceRepository.findAllActiveNotScrapedToday", () => {
  it("excludes a source with a completed run from today", async () => {
    const source = await seedJobSource();
    await seedScrapeRun({ jobSourceId: source.id, status: "completed", completedAt: new Date() });

    const result = await jobSourceRepo.findAllActiveNotScrapedToday();

    expect(result.map((s) => s.id)).not.toContain(source.id);
  });

  it("includes a source whose only completed run was yesterday", async () => {
    const source = await seedJobSource();
    await seedScrapeRun({
      jobSourceId: source.id,
      status: "completed",
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    const result = await jobSourceRepo.findAllActiveNotScrapedToday();

    expect(result.map((s) => s.id)).toContain(source.id);
  });

  it("includes a source with a non-completed run today (e.g. still running)", async () => {
    const source = await seedJobSource();
    await seedScrapeRun({ jobSourceId: source.id, status: "running" });

    const result = await jobSourceRepo.findAllActiveNotScrapedToday();

    expect(result.map((s) => s.id)).toContain(source.id);
  });

  it("includes a source with no runs at all", async () => {
    const source = await seedJobSource();

    const result = await jobSourceRepo.findAllActiveNotScrapedToday();

    expect(result.map((s) => s.id)).toContain(source.id);
  });
});

describe("JobSourceRepository.findAllWithLatestRun", () => {
  it("pairs a source with its latest run from today", async () => {
    const source = await seedJobSource();
    await seedScrapeRun({ jobSourceId: source.id, status: "completed" });

    const [result] = await jobSourceRepo.findAllWithLatestRun();

    expect(result.latestRun).not.toBeNull();
  });

  it("returns null when the source's only run was from a previous day", async () => {
    const source = await seedJobSource();
    await seedScrapeRun({
      jobSourceId: source.id,
      status: "completed",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    const [result] = await jobSourceRepo.findAllWithLatestRun();

    expect(result.latestRun).toBeNull();
  });
});
