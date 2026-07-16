import { relations } from "drizzle-orm";
import { analyticsEvents, analyticsJobEngagementRollups } from "./analytics.js";
import { companies } from "./companies.js";
import { districts, provinces } from "./geographic.js";
import { industries } from "./industries.js";
import { employmentTypes, jobCategories, jobs, workArrangements } from "./jobs.js";
import { resumeMatches, resumes } from "./resumes.js";
import { jobSources, scrapeRuns } from "./sources.js";

export const provincesRelations = relations(provinces, ({ many }) => ({
  districts: many(districts),
  companies: many(companies),
  jobs: many(jobs),
}));

export const districtsRelations = relations(districts, ({ one, many }) => ({
  province: one(provinces, { fields: [districts.provinceId], references: [provinces.id] }),
  companies: many(companies),
  jobs: many(jobs),
}));

export const industriesRelations = relations(industries, ({ many }) => ({
  companies: many(companies),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  industry: one(industries, { fields: [companies.industryId], references: [industries.id] }),
  province: one(provinces, { fields: [companies.provinceId], references: [provinces.id] }),
  district: one(districts, { fields: [companies.districtId], references: [districts.id] }),
  jobSources: many(jobSources),
  jobs: many(jobs),
}));

export const jobSourcesRelations = relations(jobSources, ({ one, many }) => ({
  company: one(companies, { fields: [jobSources.companyId], references: [companies.id] }),
  scrapeRuns: many(scrapeRuns),
  jobs: many(jobs),
}));

export const scrapeRunsRelations = relations(scrapeRuns, ({ one }) => ({
  jobSource: one(jobSources, { fields: [scrapeRuns.jobSourceId], references: [jobSources.id] }),
}));

export const employmentTypesRelations = relations(employmentTypes, ({ many }) => ({
  jobs: many(jobs),
}));

export const workArrangementsRelations = relations(workArrangements, ({ many }) => ({
  jobs: many(jobs),
}));

export const jobCategoriesRelations = relations(jobCategories, ({ one, many }) => ({
  parent: one(jobCategories, {
    fields: [jobCategories.parentId],
    references: [jobCategories.id],
    relationName: "category_parent",
  }),
  children: many(jobCategories, { relationName: "category_parent" }),
  jobs: many(jobs),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  company: one(companies, { fields: [jobs.companyId], references: [companies.id] }),
  jobSource: one(jobSources, { fields: [jobs.jobSourceId], references: [jobSources.id] }),
  province: one(provinces, { fields: [jobs.provinceId], references: [provinces.id] }),
  district: one(districts, { fields: [jobs.districtId], references: [districts.id] }),
  employmentType: one(employmentTypes, {
    fields: [jobs.employmentTypeId],
    references: [employmentTypes.id],
  }),
  workArrangement: one(workArrangements, {
    fields: [jobs.workArrangementId],
    references: [workArrangements.id],
  }),
  category: one(jobCategories, { fields: [jobs.categoryId], references: [jobCategories.id] }),
  analyticsEvents: many(analyticsEvents),
  analyticsJobEngagementRollups: many(analyticsJobEngagementRollups),
  resumeMatches: many(resumeMatches),
}));

export const resumesRelations = relations(resumes, ({ many }) => ({
  matches: many(resumeMatches),
}));

export const resumeMatchesRelations = relations(resumeMatches, ({ one }) => ({
  resume: one(resumes, { fields: [resumeMatches.resumeId], references: [resumes.id] }),
  job: one(jobs, { fields: [resumeMatches.jobId], references: [jobs.id] }),
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  job: one(jobs, { fields: [analyticsEvents.jobId], references: [jobs.id] }),
}));

export const analyticsJobEngagementRollupsRelations = relations(
  analyticsJobEngagementRollups,
  ({ one }) => ({
    job: one(jobs, { fields: [analyticsJobEngagementRollups.jobId], references: [jobs.id] }),
  })
);
