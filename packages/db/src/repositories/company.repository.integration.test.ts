import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeTestDb, resetDb, seedCompany } from "../../test/db-fixtures.js";
import { companyRepo } from "./index.js";

// Real Postgres for the slug/website lookups that back generateUniqueSlug and
// the company upsert dedup path, plus the count used by the stats endpoint.

beforeEach(resetDb);
afterAll(closeTestDb);

describe("CompanyRepository lookups", () => {
  it("finds a company by its unique slug and returns null for a missing slug", async () => {
    await seedCompany({ name: "Acme Corp", slug: "acme-corp" });

    expect((await companyRepo.findBySlug("acme-corp"))?.name).toBe("Acme Corp");
    expect(await companyRepo.findBySlug("does-not-exist")).toBeNull();
  });

  it("finds a company by its normalized website", async () => {
    await seedCompany({ name: "Acme Corp", slug: "acme", website: "https://acme.com" });

    expect((await companyRepo.findByWebsite("https://acme.com"))?.name).toBe("Acme Corp");
    expect(await companyRepo.findByWebsite("https://other.com")).toBeNull();
  });

  it("counts all companies", async () => {
    await seedCompany({ name: "A", slug: "a" });
    await seedCompany({ name: "B", slug: "b" });

    expect(await companyRepo.count()).toBe(2);
  });
});

describe("CompanyRepository.update", () => {
  it("returns the row with the changed fields applied", async () => {
    const created = await seedCompany({ name: "Old Name", slug: "co" });

    const updated = await companyRepo.update(created.id, { name: "New Name" });

    expect(updated?.name).toBe("New Name");
    expect((await companyRepo.findBySlug("co"))?.name).toBe("New Name");
  });
});
