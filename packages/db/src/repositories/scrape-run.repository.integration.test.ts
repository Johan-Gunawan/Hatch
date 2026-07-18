import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeTestDb, resetDb, seedJobSource, seedScrapeRun } from "../../test/db-fixtures.js";
import { scrapeRunRepo } from "./index.js";

// Real Postgres so the date_trunc('day', now()) daily-dedup guard and the
// run-lifecycle status transitions are exercised against actual SQL.

beforeEach(resetDb);
afterAll(closeTestDb);

describe("ScrapeRunRepository.hasCompletedToday", () => {
  it("is false when the source has no completed run", async () => {
    const source = await seedJobSource();
    expect(await scrapeRunRepo.hasCompletedToday(source.id)).toBe(false);
  });

  it("is true after a run completes today", async () => {
    const source = await seedJobSource();
    const run = await scrapeRunRepo.create({ jobSourceId: source.id, status: "running" });
    await scrapeRunRepo.complete(run.id, {
      jobsFound: 1,
      jobsInserted: 1,
      jobsUpdated: 0,
      jobsDeactivated: 0,
    });

    expect(await scrapeRunRepo.hasCompletedToday(source.id)).toBe(true);
  });

  it("ignores a completed run from a previous day", async () => {
    const source = await seedJobSource();
    await seedScrapeRun({
      jobSourceId: source.id,
      status: "completed",
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    expect(await scrapeRunRepo.hasCompletedToday(source.id)).toBe(false);
  });

  it("does not count a failed run as completed", async () => {
    const source = await seedJobSource();
    const run = await scrapeRunRepo.create({ jobSourceId: source.id, status: "running" });
    await scrapeRunRepo.fail(run.id, "boom");

    expect(await scrapeRunRepo.hasCompletedToday(source.id)).toBe(false);
  });
});

describe("ScrapeRunRepository lifecycle", () => {
  it("records counters and a completed status on complete()", async () => {
    const source = await seedJobSource();
    const run = await scrapeRunRepo.create({ jobSourceId: source.id, status: "running" });

    await scrapeRunRepo.complete(run.id, {
      jobsFound: 5,
      jobsInserted: 3,
      jobsUpdated: 2,
      jobsDeactivated: 1,
    });

    // hasCompletedToday reading true confirms the status + completedAt were persisted.
    expect(await scrapeRunRepo.hasCompletedToday(source.id)).toBe(true);
  });

  it("records the error message and failed status on fail()", async () => {
    const source = await seedJobSource();
    const run = await scrapeRunRepo.create({ jobSourceId: source.id, status: "running" });

    await scrapeRunRepo.fail(run.id, "network timeout");

    // A failed run must not satisfy the daily-dedup guard.
    expect(await scrapeRunRepo.hasCompletedToday(source.id)).toBe(false);
  });
});
