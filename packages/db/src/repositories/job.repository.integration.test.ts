import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  closeTestDb,
  resetDb,
  seedCategory,
  seedDistrict,
  seedJob,
  seedJobSource,
  seedProvince,
  seedWorkArrangement,
} from "../../test/db-fixtures.js";
import { jobRepo } from "./index.js";

// Real Drizzle queries against a throwaway Postgres (see test/global-setup.ts).
// These cover the SQL the unit-level service tests deliberately mock out:
// filter/sort condition-building, the limit+1 over-fetch, facet scoping, and
// the deactivate-missing set logic.

beforeEach(resetDb);
afterAll(closeTestDb);

describe("JobRepository.findAllEnriched", () => {
  it("over-fetches one extra row (limit + 1) so the service can derive hasMore", async () => {
    const source = await seedJobSource();
    await seedJob({ jobSourceId: source.id });
    await seedJob({ jobSourceId: source.id });
    await seedJob({ jobSourceId: source.id });

    const rows = await jobRepo.findAllEnriched({ limit: 2, isActive: true });

    expect(rows).toHaveLength(3);
  });

  it("filters out inactive jobs when isActive=true", async () => {
    const source = await seedJobSource();
    await seedJob({ jobSourceId: source.id, isActive: true });
    await seedJob({ jobSourceId: source.id, isActive: false });

    const rows = await jobRepo.findAllEnriched({ isActive: true });

    expect(rows).toHaveLength(1);
  });

  it("matches the search term against the job title", async () => {
    const source = await seedJobSource();
    await seedJob({ jobSourceId: source.id, title: "Senior Golang Engineer" });
    await seedJob({ jobSourceId: source.id, title: "Marketing Lead" });

    const rows = await jobRepo.findAllEnriched({ search: "golang", isActive: true });

    expect(rows.map((r) => r.title)).toEqual(["Senior Golang Engineer"]);
  });

  it("filters by exact company name", async () => {
    const source = await seedJobSource();
    await seedJob({ jobSourceId: source.id, companyName: "Acme" });
    await seedJob({ jobSourceId: source.id, companyName: "Globex" });

    const rows = await jobRepo.findAllEnriched({ companies: ["Acme"], isActive: true });

    expect(rows.map((r) => r.companyName)).toEqual(["Acme"]);
  });

  it("filters by a substring of the raw location text", async () => {
    const source = await seedJobSource();
    await seedJob({ jobSourceId: source.id, locationRaw: "Jakarta Selatan" });
    await seedJob({ jobSourceId: source.id, locationRaw: "Bandung" });

    const rows = await jobRepo.findAllEnriched({ locations: ["Jakarta"], isActive: true });

    expect(rows.map((r) => r.locationRaw)).toEqual(["Jakarta Selatan"]);
  });

  it("keeps jobs at/above minSalary and those with an unknown salary, dropping the rest", async () => {
    const source = await seedJobSource();
    await seedJob({ jobSourceId: source.id, title: "Low", salaryMax: 5_000_000 });
    await seedJob({ jobSourceId: source.id, title: "High", salaryMax: 15_000_000 });
    await seedJob({ jobSourceId: source.id, title: "Unknown", salaryMax: null });

    const rows = await jobRepo.findAllEnriched({ minSalary: 10_000_000, isActive: true });

    expect(rows.map((r) => r.title).sort()).toEqual(["High", "Unknown"]);
  });

  it("sorts by salary descending when sortBy=salary", async () => {
    const source = await seedJobSource();
    await seedJob({ jobSourceId: source.id, title: "Low", salaryMax: 5_000_000 });
    await seedJob({ jobSourceId: source.id, title: "High", salaryMax: 15_000_000 });

    const rows = await jobRepo.findAllEnriched({ sortBy: "salary", isActive: true });

    expect(rows.map((r) => r.title)).toEqual(["High", "Low"]);
  });
});

describe("JobRepository.getFacetOptions", () => {
  it("returns distinct active-job facets and the top salary bound", async () => {
    const province = await seedProvince("Jawa Barat");
    await seedDistrict(province.id, "Kota Bandung");
    const category = await seedCategory("Engineering");
    const workArrangement = await seedWorkArrangement("Remote");
    const source = await seedJobSource();

    await seedJob({
      jobSourceId: source.id,
      companyName: "Acme",
      categoryId: category.id,
      workArrangementId: workArrangement.id,
      locationRaw: "Kota Bandung, Jawa Barat",
      salaryMax: 9_000_000,
      isActive: true,
    });
    // Inactive job must not contribute any facet options.
    await seedJob({
      jobSourceId: source.id,
      companyName: "GhostCorp",
      salaryMax: 99_000_000,
      isActive: false,
    });

    const facets = await jobRepo.getFacetOptions();

    expect(facets.categories.map((c) => c.name)).toEqual(["Engineering"]);
    expect(facets.workArrangements.map((w) => w.name)).toEqual(["Remote"]);
    expect(facets.companies).toEqual(["Acme"]);
    expect(facets.locations.sort()).toEqual(["Jawa Barat", "Kota Bandung"]);
    expect(facets.salaryBound).toBe(9_000_000);
  });
});

describe("JobRepository.findByIdEnriched", () => {
  it("returns the enriched row for an existing job and null for a missing one", async () => {
    const source = await seedJobSource();
    const job = await seedJob({ jobSourceId: source.id, title: "Findable" });

    const found = await jobRepo.findByIdEnriched(job.id);
    expect(found?.title).toBe("Findable");

    const missing = await jobRepo.findByIdEnriched("00000000-0000-0000-0000-000000000000");
    expect(missing).toBeNull();
  });
});

describe("JobRepository counts and deactivateMissing", () => {
  it("counts active jobs and distinct active locations", async () => {
    const source = await seedJobSource();
    await seedJob({ jobSourceId: source.id, locationRaw: "Jakarta", isActive: true });
    await seedJob({ jobSourceId: source.id, locationRaw: "Jakarta", isActive: true });
    await seedJob({ jobSourceId: source.id, locationRaw: "Bandung", isActive: true });
    await seedJob({ jobSourceId: source.id, locationRaw: "Surabaya", isActive: false });

    expect(await jobRepo.countActive()).toBe(3);
    expect(await jobRepo.countActiveLocations()).toBe(2);
  });

  it("deactivates active jobs of a source whose URL is not in the seen set", async () => {
    const source = await seedJobSource();
    const keep = await seedJob({ jobSourceId: source.id, sourceUrl: "https://acme.com/jobs/keep" });
    const drop = await seedJob({ jobSourceId: source.id, sourceUrl: "https://acme.com/jobs/drop" });

    const deactivated = await jobRepo.deactivateMissing(source.id, ["https://acme.com/jobs/keep"]);

    expect(deactivated).toBe(1);
    expect((await jobRepo.findById(keep.id))?.isActive).toBe(true);
    expect((await jobRepo.findById(drop.id))?.isActive).toBe(false);
  });
});
