import { listJobFacets, listJobsPage } from "@/api/jobs.read";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { JobBoard } from "@/components/jobs/job-board";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hatch — Browse Jobs",
  description: "Search and filter open roles aggregated from companies across Indonesia.",
};

// First page only; the board fetches subsequent pages from the API as the
// user scrolls/filters, with Postgres doing the filtering/pagination.
const FIRST_PAGE_SIZE = 20;

export default async function JobsPage() {
  const [page, facetOptions] = await Promise.all([
    listJobsPage({ isActive: true, limit: FIRST_PAGE_SIZE, offset: 0 }),
    listJobFacets(),
  ]);

  return (
    <>
      <PageViewTracker path="/jobs" />
      <JobBoard
        initialJobs={page.items}
        initialHasMore={page.hasMore}
        facetOptions={facetOptions}
      />
    </>
  );
}
