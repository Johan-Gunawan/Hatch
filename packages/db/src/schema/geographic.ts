import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const districtTypeEnum = pgEnum("district_type", ["kabupaten", "kota"]);

export const provinces = pgTable("provinces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").unique(), // BPS province code e.g. "31"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const districts = pgTable("districts", {
  id: uuid("id").primaryKey().defaultRandom(),
  provinceId: uuid("province_id")
    .notNull()
    .references(() => provinces.id),
  name: text("name").notNull(),
  type: districtTypeEnum("type").notNull(),
  code: text("code"), // BPS district code
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Province = typeof provinces.$inferSelect;
export type NewProvince = typeof provinces.$inferInsert;
export type District = typeof districts.$inferSelect;
export type NewDistrict = typeof districts.$inferInsert;
