import { and, count, eq } from "drizzle-orm";
import { companies } from "../schema/companies.js";
import type { Company, NewCompany } from "../schema/companies.js";
import type { DrizzleDB } from "./types.js";

export interface CompanyFindAllOptions {
  industryId?: string;
  provinceId?: string;
  limit?: number;
}

export class CompanyRepository {
  constructor(private readonly db: DrizzleDB) {}

  async findById(id: string): Promise<Company | null> {
    const [row] = await this.db.select().from(companies).where(eq(companies.id, id)).limit(1);
    return row ?? null;
  }

  async findBySlug(slug: string): Promise<Company | null> {
    const [row] = await this.db.select().from(companies).where(eq(companies.slug, slug)).limit(1);
    return row ?? null;
  }

  async findByWebsite(website: string): Promise<Company | null> {
    const [row] = await this.db
      .select()
      .from(companies)
      .where(eq(companies.website, website))
      .limit(1);
    return row ?? null;
  }

  async findAll(opts: CompanyFindAllOptions = {}): Promise<Company[]> {
    const { industryId, provinceId, limit = 50 } = opts;

    const conditions = [
      industryId ? eq(companies.industryId, industryId) : undefined,
      provinceId ? eq(companies.provinceId, provinceId) : undefined,
    ].filter(Boolean) as Parameters<typeof and>;

    const query = this.db.select().from(companies);
    const filtered = conditions.length > 0 ? query.where(and(...conditions)) : query;
    return filtered.limit(limit);
  }

  async count(): Promise<number> {
    const [row] = await this.db.select({ value: count() }).from(companies);
    return row?.value ?? 0;
  }

  async create(data: NewCompany): Promise<Company> {
    const [row] = await this.db.insert(companies).values(data).returning();
    return row;
  }

  async update(id: string, data: Partial<NewCompany>): Promise<Company | null> {
    const [row] = await this.db
      .update(companies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return row ?? null;
  }
}
