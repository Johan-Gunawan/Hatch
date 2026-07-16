import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { districts } from "./geographic.js";
import { provinces } from "./geographic.js";
import { industries } from "./industries.js";

export const employeeCountRangeEnum = pgEnum("employee_count_range", [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001+",
]);

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  website: text("website"),
  industryId: uuid("industry_id").references(() => industries.id),
  provinceId: uuid("province_id").references(() => provinces.id),
  districtId: uuid("district_id").references(() => districts.id),
  description: text("description"),
  employeeCountRange: employeeCountRangeEnum("employee_count_range"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
