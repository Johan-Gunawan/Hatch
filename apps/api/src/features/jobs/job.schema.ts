import { z } from "@hono/zod-openapi";

export const JobSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    companyId: z.string().uuid().nullable(),
    companyName: z.string(),
    jobSourceId: z.string().uuid(),
    sourceUrl: z.string().url(),
    externalId: z.string().nullable(),
    provinceId: z.string().uuid().nullable(),
    districtId: z.string().uuid().nullable(),
    locationRaw: z.string().nullable(),
    employmentTypeId: z.string().uuid().nullable(),
    workArrangementId: z.string().uuid().nullable(),
    categoryId: z.string().uuid().nullable(),
    experienceLevel: z.enum(["entry", "mid", "senior", "lead", "executive"]).nullable(),
    salaryMin: z.number().int().nullable(),
    salaryMax: z.number().int().nullable(),
    salaryCurrency: z.string().nullable(),
    salaryPeriod: z.enum(["monthly", "yearly", "daily", "hourly"]).nullable(),
    description: z.string().nullable(),
    requirements: z.string().nullable(),
    benefits: z.string().nullable(),
    isActive: z.boolean(),
    postedAt: z.string().nullable(),
    expiresAt: z.string().nullable(),
    parsedAt: z.string().nullable(),
    rawHtml: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("Job");

// Display-ready job DTO: FK relations resolved to names, dates serialized to ISO.
// Carries detail fields (description/requirements/benefits) so the client modal
// needs no extra fetch. Used by both the list and the detail endpoints.
export const JobListItemSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    companyName: z.string(),
    companyLogoUrl: z.string().nullable(),
    categoryName: z.string().nullable(),
    workArrangementName: z.string().nullable(),
    employmentTypeName: z.string().nullable(),
    locationLabel: z.string().nullable(),
    provinceName: z.string().nullable(),
    experienceLevel: z.enum(["entry", "mid", "senior", "lead", "executive"]).nullable(),
    salaryMin: z.number().int().nullable(),
    salaryMax: z.number().int().nullable(),
    salaryCurrency: z.string().nullable(),
    salaryPeriod: z.enum(["monthly", "yearly", "daily", "hourly"]).nullable(),
    description: z.string().nullable(),
    requirements: z.string().nullable(),
    benefits: z.string().nullable(),
    postedAt: z.string().nullable(),
    sourceUrl: z.string().url(),
  })
  .openapi("JobListItem");

// Comma-separated, not repeated query params: Hono's query validator reads a
// single value per key (`c.req.query()`), so `?categoryIds=a&categoryIds=b`
// would silently only validate "a". `?categoryIds=a,b` avoids that entirely.
const csvList = z
  .string()
  .optional()
  .transform((value) => (value ? value.split(",").filter(Boolean) : []));

export const JobListQuerySchema = z.object({
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  limit: z.coerce.number().int().positive().max(500).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  q: z.string().optional(),
  categoryIds: csvList,
  workArrangementIds: csvList,
  locations: csvList,
  companies: csvList,
  minSalary: z.coerce.number().int().min(0).optional(),
  sortBy: z.enum(["relevance", "newest", "salary"]).optional().default("relevance"),
});

export const JobListResponseSchema = z
  .object({
    items: z.array(JobListItemSchema),
    hasMore: z.boolean(),
  })
  .openapi("JobListResponse");

export const JobSourceMonitorSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    careerPageUrl: z.string(),
    lastScrapedAt: z.string().nullable(),
    latestRun: z
      .object({
        status: z.enum(["pending", "running", "completed", "failed", "partial"]),
        jobsFound: z.number().int(),
        jobsInserted: z.number().int(),
        jobsUpdated: z.number().int(),
        jobsDeactivated: z.number().int(),
        errorMessage: z.string().nullable(),
        startedAt: z.string().nullable(),
        completedAt: z.string().nullable(),
      })
      .nullable(),
  })
  .openapi("JobSourceMonitor");

export const JobSourceMonitorListSchema = z
  .array(JobSourceMonitorSchema)
  .openapi("JobSourceMonitorList");

export const JobFacetOptionsSchema = z
  .object({
    categories: z.array(z.object({ id: z.string().uuid(), name: z.string() })),
    workArrangements: z.array(z.object({ id: z.string().uuid(), name: z.string() })),
    locations: z.array(z.string()),
    companies: z.array(z.string()),
    salaryBound: z.number().int(),
  })
  .openapi("JobFacetOptions");
