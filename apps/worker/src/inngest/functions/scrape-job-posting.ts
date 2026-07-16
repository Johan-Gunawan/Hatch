import { embedBatch } from "@repo/ai";
import type { z } from "zod";
import { detectSiteBehavior } from "../../lib/detect-site-behavior.js";
import { buildJobEmbeddingText } from "../../lib/embedding-source-text.js";
import { extractNextPageLink } from "../../lib/extract-next-page-link.js";
import { hybridWebsiteScrapper } from "../../lib/hybrid-website-scrapper.js";
import { callDeepseekJson } from "../../lib/llm-json.js";
import { optimizerHTML } from "../../lib/optimizer-html.js";
import {
  JOB_LISTING_EXTRACTION_SYSTEM,
  JOB_POSTING_EXTRACTION_SYSTEM,
  jobListingExtraction,
  jobPostingExtraction,
} from "../../prompts/job-posting-extraction.js";
import { DEEPSEEK_MODEL } from "../../prompts/model.js";
import { JobDetailSchema, JobStubSchema } from "../../prompts/schemas/job-posting.schema.js";
import {
  type ScraperConfig,
  parseScraperConfig,
} from "../../prompts/schemas/scraper-config.schema.js";
import * as jobSourceService from "../../services/job-source.service.js";
import * as jobService from "../../services/job.service.js";
import * as scrapeRunService from "../../services/scrape-run.service.js";
import { inngest } from "../client.js";

function extractJsonLLM(system: string, userPrompt: string): Promise<unknown> {
  return callDeepseekJson({ model: DEEPSEEK_MODEL, system, user: userPrompt });
}

export const scrapeJob = inngest.createFunction(
  { id: "scrape-job", name: "Scrape Job Posting", retries: 0 },
  { event: "job/scrape.requested" },
  async ({ event, step }) => {
    const { jobSourceId } = event.data as { jobSourceId?: string };
    console.log("job source id ", jobSourceId);

    if (!jobSourceId) {
      throw new Error("jobSourceId is required");
    }

    const jobSource = await step.run("resolve-job-source", async () => {
      return jobSourceService.findById(jobSourceId);
    });

    if (!jobSource) {
      throw new Error(`Job source not found: ${jobSourceId}`);
    }

    // const alreadyScrapedToday = await step.run("check-already-scraped-today", async () => {
    //   return scrapeRunService.hasScrapedToday(jobSourceId);
    // });

    // if (alreadyScrapedToday) {
    //   console.log("job source already scraped today, skipping", { jobSourceId });
    //   return { processed: 0, skipped: true };
    // }

    const runId = await step.run("start-scrape-run", async () => {
      return scrapeRunService.start(jobSourceId);
    });

    const resolvedJobSourceId: string = jobSourceId;
    const resolvedJobSource: NonNullable<typeof jobSource> = jobSource;

    try {
      return await runScrapeSteps();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await step.run("fail-scrape-run", async () => {
        await scrapeRunService.fail(runId, errorMessage);
      });
      throw error;
    }

    async function runScrapeSteps() {
      const lookups = await step.run("load-lookups", async () => {
        return jobService.loadLookups();
      });

      const extractDetail = async (detailUrl: string) => {
        const rawHtml = await hybridWebsiteScrapper(detailUrl, {
          forcePlaywright: effectiveConfig.requiresJsRender,
        });

        const { cleanText, links } = optimizerHTML(rawHtml, detailUrl);

        console.log("CLEAN TEXT", cleanText);

        const json = await extractJsonLLM(
          JOB_POSTING_EXTRACTION_SYSTEM,
          jobPostingExtraction({ cleanText, links, sourceUrl: detailUrl })
        );

        console.log("json-detail-job", json);

        const job = JobDetailSchema.parse(json);

        return {
          ...job,
          sourceUrl: detailUrl,
          companyName: resolvedJobSource.name,
          ...jobService.resolveLookupIds(job, lookups),
        };
      };

      // Invocation shape: a job source only — discover its vacancies (following pagination
      // up to maxPages), then extract each one.
      const scraperConfig = parseScraperConfig(resolvedJobSource.scraperConfig);
      const { maxPages } = scraperConfig;
      let effectiveConfig: ScraperConfig = scraperConfig;
      let learnedConfig: Partial<ScraperConfig> | null = null;

      const jobStubs: z.infer<typeof JobStubSchema> = [];
      const seenStubUrls = new Set<string>();

      let currentListingUrl: string | null = resolvedJobSource.careerPageUrl;
      for (let pageIndex = 0; pageIndex < maxPages && currentListingUrl; pageIndex++) {
        const listingUrl: string = currentListingUrl;
        const fetchConfig = effectiveConfig;

        const {
          stubs,
          nextPageUrl,
          learned,
        }: {
          stubs: z.infer<typeof JobStubSchema>;
          nextPageUrl: string | null;
          learned: Partial<ScraperConfig> | null;
        } = await step.run(`scrape-listing-${resolvedJobSourceId}-${pageIndex}`, async () => {
          const fetchOptions = {
            forcePlaywright: fetchConfig.requiresJsRender,
            loadMoreSelector:
              fetchConfig.paginationStrategy === "load-more-button"
                ? fetchConfig.loadMoreSelector
                : undefined,
          };

          let rawListingHtml = await hybridWebsiteScrapper(listingUrl, fetchOptions);

          let { cleanText, links } = optimizerHTML(rawListingHtml, listingUrl);
          console.log("CLEAN TEXT2 :", cleanText);
          let learned: Partial<ScraperConfig> | null = null;

          // Only learn/self-heal on the first page of a run — subsequent pages already
          // trust whatever strategy page 0 just confirmed (see `fetchConfig` above).
          console.log("PAGE INDEX:", pageIndex);
          if (pageIndex === 0) {
            let detected = detectSiteBehavior(rawListingHtml, cleanText, links, listingUrl);

            if (detected.requiresJsRender && !fetchOptions.forcePlaywright) {
              rawListingHtml = await hybridWebsiteScrapper(listingUrl, { forcePlaywright: true });
              ({ cleanText, links } = optimizerHTML(rawListingHtml, listingUrl));
              detected = detectSiteBehavior(rawListingHtml, cleanText, links, listingUrl);
            }

            const nextLink = extractNextPageLink(links, listingUrl);
            console.log("next link", nextLink);
            const paginationStrategy: ScraperConfig["paginationStrategy"] = nextLink
              ? "next-link"
              : detected.loadMoreSelector
                ? "load-more-button"
                : "single-page";

            const next: Partial<ScraperConfig> = {
              requiresJsRender: detected.requiresJsRender,
              paginationStrategy,
              loadMoreSelector: detected.loadMoreSelector ?? undefined,
            };

            if (
              next.requiresJsRender !== fetchConfig.requiresJsRender ||
              next.paginationStrategy !== fetchConfig.paginationStrategy ||
              next.loadMoreSelector !== fetchConfig.loadMoreSelector
            ) {
              learned = next;
            }
          }

          const json = await extractJsonLLM(
            JOB_LISTING_EXTRACTION_SYSTEM,
            jobListingExtraction({ cleanText, links, sourceUrl: listingUrl })
          );

          console.log("RESULT:", json);

          return {
            stubs: JobStubSchema.parse(json),
            nextPageUrl: extractNextPageLink(links, listingUrl),
            learned,
          };
        });

        if (learned) {
          effectiveConfig = { ...effectiveConfig, ...learned };
          learnedConfig = learned;
        }

        for (const stub of stubs) {
          if (stub.sourceUrl && !seenStubUrls.has(stub.sourceUrl)) {
            seenStubUrls.add(stub.sourceUrl);
          } else if (stub.requirements != null || stub.description != null) {
            stub.sourceUrl = jobSource?.careerPageUrl + "?jobName=" + stub.title || null;
          }
          jobStubs.push(stub);
        }

        currentListingUrl = nextPageUrl;
      }

      if (learnedConfig) {
        const finalLearnedConfig = learnedConfig;
        await step.run(`learn-scraper-config-${resolvedJobSourceId}`, () =>
          jobSourceService.updateScraperConfig(resolvedJobSource, finalLearnedConfig)
        );
      }

      console.log("Job stubs:", jobStubs.length);
      const savedSourceUrls: string[] = [];
      // Jobs whose embedding-relevant text is new/changed this run — embedded in
      // a single batched step after the save loop (see embed-jobs step below).
      const toEmbed: { id: string; text: string }[] = [];
      let jobsInserted = 0;
      let jobsUpdated = 0;
      for (const [index, stub] of jobStubs.entries()) {
        if (!stub.sourceUrl) continue;

        const detailUrl = stub.sourceUrl;
        const isRichStub = stub.description !== null || stub.requirements !== null;

        if (isRichStub) {
          // Listing page already provided full data — skip the detail fetch entirely.
          console.log("rich stub, using listing data directly", { detailUrl });
          try {
            const richJob = {
              title: stub.title,
              locationRaw: stub.locationRaw,
              description: stub.description,
              requirements: stub.requirements,
              benefits: stub.benefits,
              embeddingSummary: stub.embeddingSummary,
              experienceLevel: stub.experienceLevel,
              salaryMin: stub.salaryMin,
              salaryMax: stub.salaryMax,
              salaryCurrency: stub.salaryCurrency ?? "IDR",
              salaryPeriod: stub.salaryPeriod,
              postedAt: stub.postedAt,
              expiresAt: stub.expiresAt,
              employmentTypeSlug: stub.employmentTypeSlug,
              workArrangementSlug: stub.workArrangementSlug,
              sourceUrl: detailUrl,
              companyName: resolvedJobSource.name,
              ...jobService.resolveLookupIds(stub, lookups),
            };

            const saved = await step.run(`save-job-${resolvedJobSourceId}-${index}`, () =>
              jobService.saveJob({ ...richJob, jobSourceId: resolvedJobSourceId })
            );

            if (saved.wasInserted) jobsInserted++;
            else jobsUpdated++;
            if (saved.wasInserted || saved.contentChanged) {
              toEmbed.push({ id: saved.job.id, text: buildJobEmbeddingText(saved.job) });
            }
            savedSourceUrls.push(detailUrl);
          } catch (error) {
            console.log("save rich stub failed, skipping job", { detailUrl, error });
          }
        } else {
          // Summary-card stub — fetch the detail page for the full data.
          try {
            const job = await step.run(`extract-detail-${resolvedJobSourceId}-${index}`, () =>
              extractDetail(detailUrl)
            );

            const saved = await step.run(`save-job-${resolvedJobSourceId}-${index}`, () =>
              jobService.saveJob({ ...job, jobSourceId: resolvedJobSourceId })
            );

            if (saved.wasInserted) jobsInserted++;
            else jobsUpdated++;
            if (saved.wasInserted || saved.contentChanged) {
              toEmbed.push({ id: saved.job.id, text: buildJobEmbeddingText(saved.job) });
            }
            savedSourceUrls.push(detailUrl);
          } catch (error) {
            console.log("extract-detail failed, skipping job", { detailUrl, error });
          }
        }
      }

      // Pass every URL seen in this run's listing (not just the ones that saved
      // successfully) — a transient detail-page failure shouldn't deactivate an
      // otherwise-valid job that's still present in the listing.
      const attemptedSourceUrls = jobStubs
        .map((stub) => stub.sourceUrl)
        .filter((url): url is string => url !== null);
      const jobsDeactivated = await step.run(`deactivate-missing-${resolvedJobSourceId}`, () =>
        jobService.deactivateMissing(resolvedJobSourceId, attemptedSourceUrls)
      );

      // Keep the semantic-search index current: embed the jobs whose text was
      // new/changed this run, in one batched OpenAI call. Own step = isolated
      // retry; embedding failures don't roll back the saves above.
      if (toEmbed.length > 0) {
        await step.run(`embed-jobs-${resolvedJobSourceId}`, async () => {
          const vectors = await embedBatch(toEmbed.map((item) => item.text));
          await jobService.setEmbeddings(
            toEmbed.map((item, i) => ({ id: item.id, embedding: vectors[i] }))
          );
          return { embedded: toEmbed.length };
        });
      }

      await step.run("complete-scrape-run", async () => {
        await scrapeRunService.complete(runId, {
          jobsFound: jobStubs.length,
          jobsInserted,
          jobsUpdated,
          jobsDeactivated,
        });
      });

      await step.run("touch-last-scraped", async () => {
        await jobSourceService.touchLastScrapedAt(resolvedJobSourceId);
      });

      return { processed: savedSourceUrls.length };
    }
  }
);
