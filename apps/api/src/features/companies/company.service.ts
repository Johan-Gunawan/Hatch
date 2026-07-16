import { companyRepo } from "@repo/db";
import { Inngest } from "inngest";

const inngest = new Inngest({ id: "scrapper-ats" });

export const companyService = {
  list: async (limit: number) => {
    const rows = await companyRepo.findAll({ limit });
    console.log("company-service.list", JSON.stringify({ count: rows.length }));
    return rows.map((company) => ({
      id: company.id,
      name: company.name,
      slug: company.slug,
      logoUrl: company.logoUrl,
      website: company.website,
    }));
  },
  enqueueScrape: (urls: string[]) =>
    inngest.send(
      urls.map((url) => ({
        name: "company/scrape.requested" as const,
        data: { url },
      }))
    ),
};
