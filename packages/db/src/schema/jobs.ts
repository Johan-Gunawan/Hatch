import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { districts, provinces } from "./geographic.js";
import { jobSources } from "./sources.js";
import { vector } from "./vector.js";

export const experienceLevelEnum = pgEnum("experience_level", [
  "entry",
  "mid",
  "senior",
  "lead",
  "executive",
]);

export const salaryPeriodEnum = pgEnum("salary_period", ["monthly", "yearly", "daily", "hourly"]);

export const employmentTypes = pgTable("employment_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // "Full Time", "Part Time", "Contract", "Freelance", "Internship"
  slug: text("slug").notNull().unique(),
});

export const workArrangements = pgTable("work_arrangements", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // "Onsite", "Hybrid", "Remote"
  slug: text("slug").notNull().unique(),
});

export const jobCategories = pgTable("job_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  parentId: uuid("parent_id"), // self-ref; .references() omitted to avoid circular dependency
});

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  // Canonical company FK — populated after matching; raw name always stored below
  companyId: uuid("company_id").references(() => companies.id),
  companyName: text("company_name").notNull(),
  jobSourceId: uuid("job_source_id")
    .notNull()
    .references(() => jobSources.id),
  sourceUrl: text("source_url").notNull().unique(),
  externalId: text("external_id"),
  provinceId: uuid("province_id").references(() => provinces.id),
  districtId: uuid("district_id").references(() => districts.id),
  locationRaw: text("location_raw"),
  employmentTypeId: uuid("employment_type_id").references(() => employmentTypes.id),
  workArrangementId: uuid("work_arrangement_id").references(() => workArrangements.id),
  categoryId: uuid("category_id").references(() => jobCategories.id),
  experienceLevel: experienceLevelEnum("experience_level"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: text("salary_currency").default("IDR"),
  salaryPeriod: salaryPeriodEnum("salary_period"),
  description: text("description"),
  requirements: text("requirements"),
  benefits: text("benefits"),
  isActive: boolean("is_active").default(true).notNull(),
  postedAt: timestamp("posted_at"),
  expiresAt: timestamp("expires_at"),
  parsedAt: timestamp("parsed_at"),
  rawHtml: text("raw_html"),
  // English-normalized 2-4 sentence summary (title/seniority/key skills) used
  // ONLY as embedding input, never displayed — closes the cross-lingual gap
  // between Bahasa job postings and English resumes (or vice versa). Falls
  // back to raw title+description+requirements in buildJobEmbeddingText when
  // null (pre-normalization rows).
  embeddingSummary: text("embedding_summary"),
  // Semantic-search embedding of title+embeddingSummary (see @repo/ai
  // and buildJobEmbeddingText). Nullable so freshly-scraped rows are valid
  // before the embed step / backfill populates them.
  embedding: vector("embedding"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type EmploymentTypeModel = typeof employmentTypes.$inferSelect;
export type NewEmploymentTypeModel = typeof employmentTypes.$inferInsert;
export type WorkArrangementModel = typeof workArrangements.$inferSelect;
export type NewWorkArrangementModel = typeof workArrangements.$inferInsert;
export type JobCategoryModel = typeof jobCategories.$inferSelect;
export type NewJobCategoryModel = typeof jobCategories.$inferInsert;
export type JobModel = typeof jobs.$inferSelect;
export type NewJobModel = typeof jobs.$inferInsert;
