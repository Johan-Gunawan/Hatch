import z from "zod";

export const CompanySchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  website: z.string().url().nullable(),
  logoUrl: z.string().url().nullable(),
  industryRaw: z.string().nullable(),
  provinceRaw: z.string().nullable(),
  districtRaw: z.string().nullable(),
  employeeCountRange: z
    .enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1001+"])
    .nullable(),
  careerPageUrl: z.string().url().nullable(),
});
