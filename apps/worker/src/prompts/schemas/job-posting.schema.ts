import z from "zod";

export const JobDetailSchema = z.object({
  title: z.string(),
  locationRaw: z.string().nullable(),
  description: z.string().nullable(),
  requirements: z.string().nullable(),
  benefits: z.string().nullable(),
  // English-normalized summary for embedding only (see buildJobEmbeddingText) —
  // never shown to users.
  embeddingSummary: z.string().nullable(),
  experienceLevel: z.enum(["entry", "mid", "senior", "lead", "executive"]).nullable(),
  salaryMin: z.number().int().nullable(),
  salaryMax: z.number().int().nullable(),
  salaryCurrency: z.string().default("IDR"),
  salaryPeriod: z.enum(["monthly", "yearly", "daily", "hourly"]).nullable(),
  postedAt: z.string().datetime({ offset: true }).nullable(),
  expiresAt: z.string().datetime({ offset: true }).nullable(),
  employmentTypeSlug: z
    .enum(["full-time", "part-time", "contract", "freelance", "internship"])
    .nullable(),
  workArrangementSlug: z.enum(["onsite", "hybrid", "remote"]).nullable(),
});

export const JobStubSchema = z.array(
  z.object({
    title: z.string(),
    sourceUrl: z.string().url().nullable(),
    companyName: z.string().nullable(),
    locationRaw: z.string().nullable(),
    // Rich fields — populated when the listing page shows full job data inline.
    // Null when the page only shows summary cards (detail page fetch will handle them).
    description: z.string().nullable(),
    requirements: z.string().nullable(),
    benefits: z.string().nullable(),
    // English-normalized summary for embedding only — populated for rich stubs
    // (listing page already has full data), null otherwise until detail fetch.
    embeddingSummary: z.string().nullable(),
    experienceLevel: z.enum(["entry", "mid", "senior", "lead", "executive"]).nullable(),
    salaryMin: z.number().int().nullable(),
    salaryMax: z.number().int().nullable(),
    salaryCurrency: z.string().nullable(),
    salaryPeriod: z.enum(["monthly", "yearly", "daily", "hourly"]).nullable(),
    postedAt: z.string().datetime({ offset: true }).nullable(),
    expiresAt: z.string().datetime({ offset: true }).nullable(),
    employmentTypeSlug: z
      .enum(["full-time", "part-time", "contract", "freelance", "internship"])
      .nullable(),
    workArrangementSlug: z.enum(["onsite", "hybrid", "remote"]).nullable(),
  })
);
