import {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  max,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import { districts, provinces } from "../schema/geographic.js";
import { jobCategories, jobs, workArrangements } from "../schema/jobs.js";
import type { JobModel, NewJobModel } from "../schema/jobs.js";
import { resolveLocationFacetTokens } from "./job-facet-location.js";
import type { DrizzleDB } from "./types.js";

export interface JobFindAllOptions {
  limit?: number;
  isActive?: boolean;
  provinceId?: string;
  districtId?: string;
  employmentTypeId?: string;
  workArrangementId?: string;
  categoryId?: string;
  companyId?: string;
}

export type JobSortBy = "relevance" | "newest" | "salary";

export interface JobFindEnrichedOptions {
  isActive?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
  categoryIds?: string[];
  workArrangementIds?: string[];
  locations?: string[];
  companies?: string[];
  minSalary?: number;
  sortBy?: JobSortBy;
}

export interface JobFacetOptions {
  categories: { id: string; name: string }[];
  workArrangements: { id: string; name: string }[];
  locations: string[];
  companies: string[];
  salaryBound: number;
}

export interface JobEmbeddingSearchOptions {
  limit?: number;
  categoryIds?: string[];
  locations?: string[];
  minSalary?: number;
}

export interface JobEmbeddingMatch {
  job: JobModel;
  score: number; // cosine similarity in [0, 1]
}

export class JobRepository {
  constructor(private readonly db: DrizzleDB) {}

  async findById(id: string): Promise<JobModel | null> {
    const [row] = await this.db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    return row ?? null;
  }

  async findBySourceUrl(url: string): Promise<JobModel | null> {
    const [row] = await this.db.select().from(jobs).where(eq(jobs.sourceUrl, url)).limit(1);
    return row ?? null;
  }

  async findAll(opts: JobFindAllOptions = {}): Promise<JobModel[]> {
    const {
      limit = 50,
      isActive,
      provinceId,
      districtId,
      employmentTypeId,
      workArrangementId,
      categoryId,
      companyId,
    } = opts;

    const conditions = [
      isActive !== undefined ? eq(jobs.isActive, isActive) : undefined,
      provinceId ? eq(jobs.provinceId, provinceId) : undefined,
      districtId ? eq(jobs.districtId, districtId) : undefined,
      employmentTypeId ? eq(jobs.employmentTypeId, employmentTypeId) : undefined,
      workArrangementId ? eq(jobs.workArrangementId, workArrangementId) : undefined,
      categoryId ? eq(jobs.categoryId, categoryId) : undefined,
      companyId ? eq(jobs.companyId, companyId) : undefined,
    ].filter(Boolean) as Parameters<typeof and>;

    const query = this.db.select().from(jobs);
    const filtered = conditions.length > 0 ? query.where(and(...conditions)) : query;
    return filtered.limit(limit);
  }

  // Enriched, paginated, filtered list with related display names resolved in one
  // query. Powers both the job-board batch and the landing recent-jobs section.
  // Over-fetches by one row (limit + 1) so the service layer can derive `hasMore`
  // without a separate COUNT query.
  // Return type is inferred (not annotated) because JobEnriched below is itself
  // derived from this method's return type — annotating it would be circular.
  async findAllEnriched(opts: JobFindEnrichedOptions = {}) {
    const {
      isActive,
      limit = 50,
      offset = 0,
      search,
      categoryIds = [],
      workArrangementIds = [],
      locations = [],
      companies = [],
      minSalary,
      sortBy = "relevance",
    } = opts;
    console.log(
      "job-repo.findAllEnriched",
      JSON.stringify({
        isActive,
        limit,
        offset,
        search,
        categoryIds,
        workArrangementIds,
        locations,
        companies,
        minSalary,
        sortBy,
      })
    );

    const salaryTop = sql`coalesce(${jobs.salaryMax}, ${jobs.salaryMin})`;

    const conditions = [
      isActive !== undefined ? eq(jobs.isActive, isActive) : undefined,
      search
        ? or(
            ilike(jobs.title, `%${search}%`),
            ilike(jobs.companyName, `%${search}%`),
            inArray(
              jobs.categoryId,
              this.db
                .select({ id: jobCategories.id })
                .from(jobCategories)
                .where(ilike(jobCategories.name, `%${search}%`))
            )
          )
        : undefined,
      categoryIds.length > 0 ? inArray(jobs.categoryId, categoryIds) : undefined,
      workArrangementIds.length > 0
        ? inArray(jobs.workArrangementId, workArrangementIds)
        : undefined,
      locations.length > 0
        ? or(...locations.map((loc) => ilike(jobs.locationRaw, `%${loc}%`)))
        : undefined,
      companies.length > 0 ? inArray(jobs.companyName, companies) : undefined,
      minSalary && minSalary > 0
        ? or(sql`${salaryTop} is null`, sql`${salaryTop} >= ${minSalary}`)
        : undefined,
    ].filter(Boolean) as Parameters<typeof and>;

    const orderBy =
      sortBy === "salary"
        ? [sql`${salaryTop} desc nulls last`, desc(jobs.postedAt)]
        : [desc(jobs.postedAt), desc(jobs.createdAt)];

    return this.db.query.jobs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy,
      limit: limit + 1,
      offset,
      with: {
        company: { columns: { name: true, logoUrl: true } },
        category: { columns: { name: true } },
        workArrangement: { columns: { name: true } },
        employmentType: { columns: { name: true } },
        province: { columns: { name: true } },
        district: { columns: { name: true } },
      },
    });
  }

  // Distinct filter options available across active jobs, scoped to isActive=true
  // to match the job-board's default view. Computed once (no live recompute as
  // filters change) since per-option counts were dropped from scope.
  async getFacetOptions(): Promise<JobFacetOptions> {
    console.log("job-repo.getFacetOptions", JSON.stringify({}));

    const [
      categories,
      workArrangementRows,
      locationRows,
      companyRows,
      salaryRow,
      provinceRows,
      districtRows,
    ] = await Promise.all([
      this.db
        .selectDistinct({ id: jobCategories.id, name: jobCategories.name })
        .from(jobs)
        .innerJoin(jobCategories, eq(jobs.categoryId, jobCategories.id))
        .where(eq(jobs.isActive, true)),
      this.db
        .selectDistinct({ id: workArrangements.id, name: workArrangements.name })
        .from(jobs)
        .innerJoin(workArrangements, eq(jobs.workArrangementId, workArrangements.id))
        .where(eq(jobs.isActive, true)),
      this.db
        .selectDistinct({ locationRaw: jobs.locationRaw })
        .from(jobs)
        .where(and(eq(jobs.isActive, true), isNotNull(jobs.locationRaw))),
      this.db
        .selectDistinct({ companyName: jobs.companyName })
        .from(jobs)
        .where(eq(jobs.isActive, true)),
      this.db
        .select({ bound: max(sql`coalesce(${jobs.salaryMax}, ${jobs.salaryMin})`) })
        .from(jobs)
        .where(eq(jobs.isActive, true)),
      this.db.select({ name: provinces.name }).from(provinces),
      this.db.select({ name: districts.name }).from(districts),
    ]);

    // Split each locationRaw on commas, keep only tokens that exactly match a
    // canonical province or district name (case-insensitive). Deduplicate and sort.
    const locationTokens = resolveLocationFacetTokens(
      locationRows.map((row) => row.locationRaw),
      [...provinceRows.map((row) => row.name), ...districtRows.map((row) => row.name)]
    );

    const result = {
      categories,
      workArrangements: workArrangementRows,
      locations: locationTokens,
      companies: companyRows.map((row) => row.companyName),
      salaryBound: Number(salaryRow[0]?.bound ?? 0),
    };
    console.log(
      "job-repo.getFacetOptions",
      JSON.stringify({
        categories: result.categories.length,
        workArrangements: result.workArrangements.length,
        locations: {
          rawCount: locationRows.length,
          canonicalCount: provinceRows.length + districtRows.length,
          tokenCount: result.locations.length,
        },
        companies: result.companies.length,
        salaryBound: result.salaryBound,
      })
    );
    return result;
  }

  async findByIdEnriched(id: string) {
    console.log("job-repo.findByIdEnriched", JSON.stringify({ id }));
    const row = await this.db.query.jobs.findFirst({
      where: eq(jobs.id, id),
      with: {
        company: { columns: { name: true, logoUrl: true } },
        category: { columns: { name: true } },
        workArrangement: { columns: { name: true } },
        employmentType: { columns: { name: true } },
        province: { columns: { name: true } },
        district: { columns: { name: true } },
      },
    });
    return row ?? null;
  }

  async countActive(): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(jobs)
      .where(eq(jobs.isActive, true));
    return row?.value ?? 0;
  }

  // Distinct locations among active jobs — the landing "cities" stat. Uses the
  // scraped locationRaw text rather than provinceId: the scraper doesn't currently
  // backfill the province FK, so it's null on every row and would always read 0.
  async countActiveLocations(): Promise<number> {
    const [row] = await this.db
      .select({ value: countDistinct(jobs.locationRaw) })
      .from(jobs)
      .where(eq(jobs.isActive, true));
    return row?.value ?? 0;
  }

  async create(data: NewJobModel): Promise<JobModel> {
    const [row] = await this.db.insert(jobs).values(data).returning();
    return row;
  }

  async createOrSkip(data: NewJobModel): Promise<void> {
    await this.db.insert(jobs).values(data).onConflictDoNothing();
  }

  async update(id: string, data: Partial<NewJobModel>): Promise<JobModel | null> {
    const [row] = await this.db
      .update(jobs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return row ?? null;
  }

  async deactivate(id: string): Promise<void> {
    await this.db
      .update(jobs)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(jobs.id, id));
  }

  async deactivateMissing(jobSourceId: string, seenSourceUrls: string[]): Promise<number> {
    const deactivated = await this.db
      .update(jobs)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(jobs.jobSourceId, jobSourceId),
          eq(jobs.isActive, true),
          ...(seenSourceUrls.length > 0 ? [notInArray(jobs.sourceUrl, seenSourceUrls)] : [])
        )
      )
      .returning({ id: jobs.id });
    return deactivated.length;
  }

  // --- Semantic search (pgvector) -----------------------------------------

  // Jobs still missing an embedding, oldest first. Stable order makes the
  // backfill resumable: a crash mid-run just re-selects whatever is still NULL.
  async findWithoutEmbedding(limit: number): Promise<JobModel[]> {
    console.log("job-repo.findWithoutEmbedding", JSON.stringify({ limit }));
    return this.db
      .select()
      .from(jobs)
      .where(sql`${jobs.embedding} is null`)
      .orderBy(asc(jobs.createdAt))
      .limit(limit);
  }

  // Write embeddings back for a batch of jobs (used by backfill + scrape hook).
  async setEmbeddingsBatch(rows: { id: string; embedding: number[] }[]): Promise<void> {
    console.log("job-repo.setEmbeddingsBatch", JSON.stringify({ count: rows.length }));
    for (const row of rows) {
      await this.db
        .update(jobs)
        .set({ embedding: row.embedding, updatedAt: new Date() })
        .where(eq(jobs.id, row.id));
    }
  }

  // Nearest active jobs to a query embedding by cosine distance (`<=>`), with
  // optional cheap SQL pre-filters. Returns rows plus a similarity score in
  // [0, 1] (1 = identical). Ordering by the distance expression uses the HNSW
  // index built in the pgvector migration.
  async searchByEmbedding(
    queryEmbedding: number[],
    opts: JobEmbeddingSearchOptions = {}
  ): Promise<JobEmbeddingMatch[]> {
    const { limit = 20, categoryIds = [], locations = [], minSalary } = opts;
    const queryLiteral = `[${queryEmbedding.join(",")}]`;
    const distance = sql<number>`${jobs.embedding} <=> ${queryLiteral}::vector`;
    const salaryTop = sql`coalesce(${jobs.salaryMax}, ${jobs.salaryMin})`;

    const conditions = [
      eq(jobs.isActive, true),
      sql`${jobs.embedding} is not null`,
      categoryIds.length > 0 ? inArray(jobs.categoryId, categoryIds) : undefined,
      locations.length > 0
        ? or(...locations.map((loc) => ilike(jobs.locationRaw, `%${loc}%`)))
        : undefined,
      minSalary && minSalary > 0
        ? or(sql`${salaryTop} is null`, sql`${salaryTop} >= ${minSalary}`)
        : undefined,
    ].filter(Boolean) as Parameters<typeof and>;

    const rows = await this.db
      .select({ job: jobs, score: sql<number>`1 - (${distance})` })
      .from(jobs)
      .where(and(...conditions))
      .orderBy(distance)
      .limit(limit);

    console.log(
      "job-repo.searchByEmbedding",
      JSON.stringify({ returned: rows.length, top: rows[0]?.score })
    );
    return rows.map((row) => ({ job: row.job, score: Number(row.score) }));
  }
}

// A job row with its display-relevant relations resolved (names only).
export type JobEnriched = Awaited<ReturnType<JobRepository["findAllEnriched"]>>[number];
