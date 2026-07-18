import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  companies,
  districts,
  jobCategories,
  jobSources,
  jobs,
  provinces,
  scrapeRuns,
  workArrangements,
} from "../src/schema/index.js";
import type {
  Company,
  District,
  JobCategoryModel,
  JobModel,
  JobSource,
  NewCompany,
  NewJobModel,
  Province,
  ScrapeRun,
  WorkArrangementModel,
} from "../src/schema/index.js";

// A fixtures-only connection to the same throwaway container the repos use
// (DATABASE_URL is set by setup-env.ts before this module loads). Seeding on a
// separate pool is fine — Postgres autocommits, so rows are visible to the repo
// pool immediately. Keeping this separate from @repo/db's singleton keeps the
// seed helpers self-contained.
// biome-ignore lint/style/noNonNullAssertion: setup-env.ts guarantees this is set before import
const client = postgres(process.env.DATABASE_URL!, { max: 1 });
export const testDb = drizzle(client);

export async function closeTestDb(): Promise<void> {
  await client.end();
}

// Truncate everything between tests so each test sees a known-empty DB.
// RESTART IDENTITY + CASCADE clears dependent rows regardless of FK order.
export async function resetDb(): Promise<void> {
  await testDb.execute(
    sql`TRUNCATE TABLE jobs, scrape_runs, resume_matches, resumes, job_sources, companies, districts, provinces, job_categories, work_arrangements, employment_types, industries RESTART IDENTITY CASCADE`
  );
}

let uniqueCounter = 0;
function unique(prefix: string): string {
  uniqueCounter += 1;
  return `${prefix}-${uniqueCounter}`;
}

export async function seedProvince(name = "Jawa Barat"): Promise<Province> {
  const [row] = await testDb.insert(provinces).values({ name }).returning();
  return row;
}

export async function seedDistrict(
  provinceId: string,
  name = "Kota Bandung",
  type: District["type"] = "kota"
): Promise<District> {
  const [row] = await testDb.insert(districts).values({ provinceId, name, type }).returning();
  return row;
}

export async function seedCompany(overrides: Partial<NewCompany> = {}): Promise<Company> {
  const name = overrides.name ?? "Acme Corp";
  const [row] = await testDb
    .insert(companies)
    .values({ name, slug: overrides.slug ?? unique("acme"), ...overrides })
    .returning();
  return row;
}

export async function seedJobSource(overrides: Partial<JobSource> = {}): Promise<JobSource> {
  const [row] = await testDb
    .insert(jobSources)
    .values({
      name: overrides.name ?? "Acme Careers",
      careerPageUrl: overrides.careerPageUrl ?? unique("https://acme.com/careers"),
      companyId: overrides.companyId,
      isActive: overrides.isActive ?? true,
    })
    .returning();
  return row;
}

export async function seedCategory(name = "Engineering"): Promise<JobCategoryModel> {
  const [row] = await testDb
    .insert(jobCategories)
    .values({ name, slug: unique("cat") })
    .returning();
  return row;
}

export async function seedWorkArrangement(name = "Remote"): Promise<WorkArrangementModel> {
  const [row] = await testDb
    .insert(workArrangements)
    .values({ name, slug: unique("wa") })
    .returning();
  return row;
}

export async function seedJob(
  overrides: Partial<NewJobModel> & { jobSourceId: string }
): Promise<JobModel> {
  const [row] = await testDb
    .insert(jobs)
    .values({
      title: overrides.title ?? "Software Engineer",
      companyName: overrides.companyName ?? "Acme Corp",
      sourceUrl: overrides.sourceUrl ?? unique("https://acme.com/jobs"),
      isActive: overrides.isActive ?? true,
      ...overrides,
    })
    .returning();
  return row;
}

export async function seedScrapeRun(
  overrides: Partial<ScrapeRun> & { jobSourceId: string }
): Promise<ScrapeRun> {
  const [row] = await testDb
    .insert(scrapeRuns)
    .values({
      jobSourceId: overrides.jobSourceId,
      status: overrides.status ?? "pending",
      completedAt: overrides.completedAt,
      startedAt: overrides.startedAt,
    })
    .returning();
  return row;
}
