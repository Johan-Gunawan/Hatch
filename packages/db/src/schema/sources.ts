import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { companies } from "./companies.js";

export const scrapeStatusEnum = pgEnum("scrape_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "partial",
]);

export const jobSources = pgTable("job_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  companyId: uuid("company_id").references(() => companies.id),
  careerPageUrl: text("career_page_url").notNull(),
  // hints which scraper strategy to use: 'greenhouse', 'lever', 'workday', 'custom'
  atsPlatform: text("ats_platform"),
  scraperConfig: jsonb("scraper_config"),
  isActive: boolean("is_active").default(true).notNull(),
  lastScrapedAt: timestamp("last_scraped_at"),
  scrapeIntervalHours: integer("scrape_interval_hours").default(24).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const scrapeRuns = pgTable("scrape_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobSourceId: uuid("job_source_id")
    .notNull()
    .references(() => jobSources.id),
  status: scrapeStatusEnum("status").notNull().default("pending"),
  jobsFound: integer("jobs_found").default(0).notNull(),
  jobsInserted: integer("jobs_inserted").default(0).notNull(),
  jobsUpdated: integer("jobs_updated").default(0).notNull(),
  jobsDeactivated: integer("jobs_deactivated").default(0).notNull(),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type JobSource = typeof jobSources.$inferSelect;
export type NewJobSource = typeof jobSources.$inferInsert;
export type ScrapeRun = typeof scrapeRuns.$inferSelect;
export type NewScrapeRun = typeof scrapeRuns.$inferInsert;
