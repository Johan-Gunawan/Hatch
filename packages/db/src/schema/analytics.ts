import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { jobs } from "./jobs.js";

export const analyticsEventTypeEnum = pgEnum("analytics_event_type", [
  "visit",
  "search",
  "job_view",
  "apply_click",
]);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventType: analyticsEventTypeEnum("event_type").notNull(),
    visitorId: text("visitor_id").notNull(),
    sessionId: text("session_id").notNull(),
    path: text("path"), // visit only
    jobId: uuid("job_id").references(() => jobs.id), // job_view / apply_click only
    searchQuery: text("search_query"), // search only, stored verbatim
    searchFilters: jsonb("search_filters"), // search only
    isZeroResult: boolean("is_zero_result"), // search only
    metadata: jsonb("metadata"), // referrer, device/UA class, bot-signal flags
    ipHash: text("ip_hash"), // hashed, never raw IP; audit-only
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("analytics_events_type_created_at_idx").on(table.eventType, table.createdAt),
    index("analytics_events_job_visitor_created_idx").on(
      table.jobId,
      table.visitorId,
      table.createdAt
    ),
    index("analytics_events_session_created_idx").on(table.sessionId, table.createdAt),
  ]
);

export const analyticsDailyRollups = pgTable("analytics_daily_rollups", {
  id: uuid("id").primaryKey().defaultRandom(),
  day: date("day").notNull().unique(),
  visitCount: integer("visit_count").default(0).notNull(),
  uniqueVisitorCount: integer("unique_visitor_count").default(0).notNull(),
  searchCount: integer("search_count").default(0).notNull(),
  jobViewCount: integer("job_view_count").default(0).notNull(),
  applyClickCount: integer("apply_click_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const analyticsSearchTermRollups = pgTable(
  "analytics_search_term_rollups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    day: date("day").notNull(),
    normalizedTerm: text("normalized_term").notNull(),
    searchCount: integer("search_count").default(0).notNull(),
    zeroResultCount: integer("zero_result_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("analytics_search_term_rollups_day_term_unique").on(table.day, table.normalizedTerm),
  ]
);

export const analyticsJobEngagementRollups = pgTable(
  "analytics_job_engagement_rollups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    day: date("day").notNull(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id),
    jobViewCount: integer("job_view_count").default(0).notNull(),
    applyClickCount: integer("apply_click_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [unique("analytics_job_engagement_rollups_day_job_unique").on(table.day, table.jobId)]
);

export type AnalyticsEventModel = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEventModel = typeof analyticsEvents.$inferInsert;
export type AnalyticsDailyRollupModel = typeof analyticsDailyRollups.$inferSelect;
export type NewAnalyticsDailyRollupModel = typeof analyticsDailyRollups.$inferInsert;
export type AnalyticsSearchTermRollupModel = typeof analyticsSearchTermRollups.$inferSelect;
export type NewAnalyticsSearchTermRollupModel = typeof analyticsSearchTermRollups.$inferInsert;
export type AnalyticsJobEngagementRollupModel = typeof analyticsJobEngagementRollups.$inferSelect;
export type NewAnalyticsJobEngagementRollupModel =
  typeof analyticsJobEngagementRollups.$inferInsert;
