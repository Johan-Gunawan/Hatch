import { detectBrandedAts } from "../../lib/detect-branded-ats.js";
import { filterCareerLinks } from "../../lib/filter-career-links.js";
import { hybridWebsiteScrapper } from "../../lib/hybrid-website-scrapper.js";
import { callDeepseekJson } from "../../lib/llm-json.js";
import { optimizerHTML } from "../../lib/optimizer-html.js";
import { probeCareerUrls } from "../../lib/probe-career-urls.js";
import {
  COMPANY_EXTRACTION_SYSTEM,
  companyExtractionPrompt,
} from "../../prompts/company-extraction.js";
import { DEEPSEEK_MODEL } from "../../prompts/model.js";
import { FAILED_ATS_DETECTION } from "../../prompts/schemas/ats-detection.schema.js";
import { CompanySchema } from "../../prompts/schemas/company.schema.js";
import * as companyService from "../../services/company.service.js";
import * as jobSourceService from "../../services/job-source.service.js";
import { inngest } from "../client.js";

export const scrapeCompany = inngest.createFunction(
  { id: "scrape-company", name: "Scrape Company Homepage", retries: 2 },
  { event: "company/scrape.requested" },
  async ({ event, step }) => {
    const { url } = event.data as { url: string };

    const rawHtml = await step.run("scrape-homepage", () =>
      hybridWebsiteScrapper(url, { retrySpashell: true })
    );

    const extracted = await step.run("extract-company-data", async () => {
      const baseUrl = new URL(url);

      const { cleanText, links } = optimizerHTML(rawHtml, url);
      console.log("scrape-company extracted-links", links);

      let careerLinks = filterCareerLinks(links);
      if (careerLinks.length === 0) {
        console.log("scrape-company", { event: "no-career-links-found-probing-candidates", url });
        const probed = await probeCareerUrls(new URL(url).origin);
        careerLinks = probed;
      }

      const json = await callDeepseekJson({
        model: DEEPSEEK_MODEL,
        system: COMPANY_EXTRACTION_SYSTEM,
        user: companyExtractionPrompt({
          cleanText,
          links: careerLinks,
          sourceUrl: url,
          hostname: baseUrl.hostname,
        }),
        maxTokens: 4096,
      });
      console.log("links", JSON.stringify(careerLinks));
      console.log(json);

      return CompanySchema.parse(json);
    });

    const resolvedIds = await step.run("resolve-lookup-ids", async () => {
      return companyService.resolveLookups({
        provinceRaw: extracted.provinceRaw,
        districtRaw: extracted.districtRaw,
        industryRaw: extracted.industryRaw,
      });
    });

    const company = await step.run("upsert-company", async () => {
      return companyService.upsertCompany(url, extracted, resolvedIds);
    });

    const careerPageUrl = extracted.careerPageUrl;

    console.log("careerPageUrl: ", careerPageUrl);
    if (careerPageUrl) {
      const careerPageSignals = await step.run("scrape-career-page", async () => {
        try {
          const careerPageHtml = await hybridWebsiteScrapper(careerPageUrl);
          return { rawHtml: careerPageHtml, ...optimizerHTML(careerPageHtml, careerPageUrl) };
        } catch (err) {
          console.log(`career page fetch failed for ${careerPageUrl}, failing open:`, err);
          return null;
        }
      });
      console.log("careerPageSignals: ", careerPageSignals);

      const atsVerdict = careerPageSignals
        ? await step.run("detect-ats-platform", () =>
            detectBrandedAts(
              careerPageSignals.rawHtml,
              careerPageSignals.cleanText,
              careerPageSignals.links,
              careerPageUrl
            )
          )
        : FAILED_ATS_DETECTION;

      console.log("careerPageSignals: ", atsVerdict);

      await step.run("upsert-job-source", async () => {
        return jobSourceService.upsertForCompany(
          company?.id,
          { name: extracted.name, careerPageUrl },
          { atsPlatform: atsVerdict.atsPlatform, isActive: !atsVerdict.isBrandedAts }
        );
      });
    }

    return { url, name: extracted.name, companyId: company?.id };
  }
);
