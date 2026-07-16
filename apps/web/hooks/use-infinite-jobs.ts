"use client";

import { fetchJobsPage } from "@/api/jobs";
import { trackSearch } from "@/api/track";
import type { Job, JobListParams } from "@/components/jobs/job-board-data";
import { useEffect, useRef, useState } from "react";

const PAGE_SIZE = 20;

export type InfiniteJobsFilters = Omit<JobListParams, "isActive" | "limit" | "offset">;

interface UseInfiniteJobsArgs {
  filters: InfiniteJobsFilters;
  initialJobs: Job[];
  initialHasMore: boolean;
}

interface UseInfiniteJobsResult {
  jobs: Job[];
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
}

// Owns the loaded-jobs array/offset/hasMore for the jobs board's infinite scroll.
// Seeded from the SSR-fetched first page; refetches page 1 whenever `filters`
// changes (search/category/work-arrangement/location/company/minSalary/sortBy),
// and appends subsequent pages via loadMore() as the scroll sentinel fires.
export function useInfiniteJobs({
  filters,
  initialJobs,
  initialHasMore,
}: UseInfiniteJobsArgs): UseInfiniteJobsResult {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFirstRun = useRef(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: filters is a freshly-built object each render; its fields are the real dependencies
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    let cancelled = false;

    async function refetch(): Promise<void> {
      console.log("use-infinite-jobs:refetch", JSON.stringify({ filters }));
      setIsLoading(true);
      try {
        const res = await fetchJobsPage({
          isActive: true,
          limit: PAGE_SIZE,
          offset: 0,
          ...filters,
        });
        if (cancelled) return;
        setJobs(res.items);
        setHasMore(res.hasMore);
        if (filters.q) {
          trackSearch({
            query: filters.q,
            filters: {
              categoryIds: filters.categoryIds,
              workArrangementIds: filters.workArrangementIds,
              locations: filters.locations,
              companies: filters.companies,
              minSalary: filters.minSalary,
            },
            isZeroResult: res.items.length === 0,
          });
        }
      } catch (err) {
        console.log("use-infinite-jobs:refetch-error", JSON.stringify({ error: String(err) }));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    refetch();

    return () => {
      cancelled = true;
    };
  }, [
    filters.q,
    filters.categoryIds,
    filters.workArrangementIds,
    filters.locations,
    filters.companies,
    filters.minSalary,
    filters.sortBy,
  ]);

  async function loadMore(): Promise<void> {
    if (isLoadingMore || isLoading || !hasMore) return;

    console.log("use-infinite-jobs:loadMore", JSON.stringify({ offset: jobs.length }));
    setIsLoadingMore(true);
    try {
      const res = await fetchJobsPage({
        isActive: true,
        limit: PAGE_SIZE,
        offset: jobs.length,
        ...filters,
      });
      setJobs((prev) => [...prev, ...res.items]);
      setHasMore(res.hasMore);
    } catch (err) {
      console.log("use-infinite-jobs:loadMore-error", JSON.stringify({ error: String(err) }));
    } finally {
      setIsLoadingMore(false);
    }
  }

  return { jobs, hasMore, isLoading, isLoadingMore, loadMore };
}
