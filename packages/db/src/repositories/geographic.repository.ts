import { eq } from "drizzle-orm";
import { districts, provinces } from "../schema/geographic.js";
import type { District, Province } from "../schema/geographic.js";
import type { DrizzleDB } from "./types.js";

export class GeographicRepository {
  constructor(private readonly db: DrizzleDB) {}

  async findAllProvinces(): Promise<Province[]> {
    return this.db.select().from(provinces);
  }

  async findProvinceById(id: string): Promise<Province | null> {
    const [row] = await this.db.select().from(provinces).where(eq(provinces.id, id)).limit(1);
    return row ?? null;
  }

  async findProvinceByCode(code: string): Promise<Province | null> {
    const [row] = await this.db.select().from(provinces).where(eq(provinces.code, code)).limit(1);
    return row ?? null;
  }

  async findDistrictsByProvinceId(provinceId: string): Promise<District[]> {
    return this.db.select().from(districts).where(eq(districts.provinceId, provinceId));
  }

  async findDistrictById(id: string): Promise<District | null> {
    const [row] = await this.db.select().from(districts).where(eq(districts.id, id)).limit(1);
    return row ?? null;
  }
}
