import { z } from "@hono/zod-openapi";

export const MatchRequestSchema = z
  .object({
    resumeText: z.string().min(50),
    fileName: z.string().optional(),
    locations: z.array(z.string()).optional(),
    minSalary: z.number().int().min(0).optional(),
  })
  .openapi("ResumeMatchRequest");

export const ResumeProfileSchema = z
  .object({
    skills: z.array(z.string()),
    jobTitles: z.array(z.string()),
    seniority: z.string().nullable(),
    yearsExperience: z.number().nullable().optional(),
    locationPref: z.string().nullable().optional(),
    summary: z.string().nullable().optional(),
  })
  .openapi("ResumeProfile");

export const MatchedJobSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    companyName: z.string(),
    locationRaw: z.string().nullable(),
    salaryMin: z.number().int().nullable(),
    salaryMax: z.number().int().nullable(),
    salaryCurrency: z.string().nullable(),
    salaryPeriod: z.enum(["monthly", "yearly", "daily", "hourly"]).nullable(),
    sourceUrl: z.string().url(),
    score: z.number(), // cosine similarity in [0, 1]
  })
  .openapi("ResumeMatchedJob");

export const MatchResponseSchema = z
  .object({
    resumeId: z.string().uuid(),
    profile: ResumeProfileSchema,
    items: z.array(MatchedJobSchema),
    weakMatch: z.boolean(),
    fallbackUsed: z.enum(["none", "relaxed-filters", "closest"]),
  })
  .openapi("ResumeMatchResponse");

export const ExplainRequestSchema = z
  .object({
    resumeId: z.string().uuid(),
  })
  .openapi("ResumeExplainRequest");

export const ExplainResponseSchema = z
  .object({
    jobId: z.string().uuid(),
    summary: z.string(),
    strengths: z.array(z.string()),
    gaps: z.array(z.string()),
  })
  .openapi("ResumeExplainResponse");

export type MatchRequest = z.infer<typeof MatchRequestSchema>;
export type MatchResponse = z.infer<typeof MatchResponseSchema>;
export type MatchedJob = z.infer<typeof MatchedJobSchema>;
export type ExplainResponse = z.infer<typeof ExplainResponseSchema>;
