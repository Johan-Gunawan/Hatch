import { type JobEnriched, type JobSourceWithLatestRun, jobRepo, jobSourceRepo } from "@repo/db";
import { Inngest } from "inngest";

const inngest = new Inngest({ id: "scrapper-ats" });

function toSourceMonitor(source: JobSourceWithLatestRun) {
  const run = source.latestRun;
  return {
    id: source.id,
    name: source.name,
    careerPageUrl: source.careerPageUrl,
    lastScrapedAt: source.lastScrapedAt ? source.lastScrapedAt.toISOString() : null,
    latestRun: run
      ? {
          status: run.status,
          jobsFound: run.jobsFound,
          jobsInserted: run.jobsInserted,
          jobsUpdated: run.jobsUpdated,
          jobsDeactivated: run.jobsDeactivated,
          errorMessage: run.errorMessage,
          startedAt: run.startedAt ? run.startedAt.toISOString() : null,
          completedAt: run.completedAt ? run.completedAt.toISOString() : null,
        }
      : null,
  };
}

// Flatten an enriched job row into the display-ready DTO the frontend consumes.
function toListItem(job: JobEnriched) {
  const locationLabel =
    job.district?.name && job.province?.name
      ? `${job.district.name}, ${job.province.name}`
      : (job.province?.name ?? job.locationRaw ?? null);

  return {
    id: job.id,
    title: job.title,
    companyName: job.companyName,
    companyLogoUrl: job.company?.logoUrl ?? null,
    categoryName: job.category?.name ?? null,
    workArrangementName: job.workArrangement?.name ?? null,
    employmentTypeName: job.employmentType?.name ?? null,
    locationLabel,
    provinceName: job.province?.name ?? null,
    experienceLevel: job.experienceLevel,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    salaryPeriod: job.salaryPeriod,
    description: job.description,
    requirements: job.requirements,
    benefits: job.benefits,
    postedAt: job.postedAt ? job.postedAt.toISOString() : null,
    sourceUrl: job.sourceUrl,
  };
}

export const jobService = {
  list: async (opts: {
    isActive?: boolean;
    limit?: number;
    offset?: number;
    search?: string;
    categoryIds?: string[];
    workArrangementIds?: string[];
    locations?: string[];
    companies?: string[];
    minSalary?: number;
    sortBy?: "relevance" | "newest" | "salary";
  }): Promise<{ items: ReturnType<typeof toListItem>[]; hasMore: boolean }> => {
    const limit = opts.limit ?? 50;
    const rows = await jobRepo.findAllEnriched({ ...opts, limit });
    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit).map(toListItem);
    console.log("job-service.list", JSON.stringify({ count: items.length, hasMore }));
    return { items, hasMore };
  },
  getFacetOptions: async (): Promise<{
    categories: { id: string; name: string }[];
    workArrangements: { id: string; name: string }[];
    locations: string[];
    companies: string[];
    salaryBound: number;
  }> => {
    const facets = await jobRepo.getFacetOptions();
    console.log(
      "job-service.getFacetOptions",
      JSON.stringify({
        categories: facets.categories.length,
        workArrangements: facets.workArrangements.length,
        locations: facets.locations.length,
        companies: facets.companies.length,
      })
    );
    return facets;
  },
  getDetail: async (id: string) => {
    const row = await jobRepo.findByIdEnriched(id);
    return row ? toListItem(row) : null;
  },
  listSources: async (): Promise<ReturnType<typeof toSourceMonitor>[]> => {
    const sources = await jobSourceRepo.findAllWithLatestRun();
    console.log("job-service.listSources", JSON.stringify({ count: sources.length }));
    return sources.map(toSourceMonitor);
  },
  enqueueScrape: async (jobSourceId?: string) => {
    if (!jobSourceId) {
      const jobSources = await jobSourceRepo.findAllActiveNotScrapedToday();
      console.log("enqueueScrape - fan out to sources not scraped today", {
        count: jobSources.length,
      });
      for (const jobSource of jobSources) {
        inngest.send({
          name: "job/scrape.requested" as const,
          data: { jobSourceId: jobSource.id },
        });
      }
    } else {
      inngest.send({
        name: "job/scrape.requested" as const,
        data: { jobSourceId },
      });
    }
  },
};
