import type { Job } from "@/components/jobs/job-board-data";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";
import type { InfiniteJobsFilters } from "./use-infinite-jobs";

const fetchJobsPageMock = vi.fn();
const trackSearchMock = vi.fn();

// use-infinite-jobs's direct collaborators are fetchJobsPage and trackSearch.
// Mock both seams (matching the hook's own "@/api/jobs" / "@/api/track"
// specifiers) and assert the hook's own state machine: the no-fetch-on-mount
// guard, refetch-on-filter-change, loadMore pagination/append, and error handling.
vi.mock("@/api/jobs", () => ({
  fetchJobsPage: fetchJobsPageMock,
}));

vi.mock("@/api/track", () => ({
  trackSearch: trackSearchMock,
}));

const { useInfiniteJobs } = await import("./use-infinite-jobs");

function makeJob(id: string): Job {
  return {
    id,
    title: `Job ${id}`,
    companyName: "Acme",
    companyLogoUrl: null,
    categoryName: null,
    workArrangementName: null,
    employmentTypeName: null,
    locationLabel: null,
    provinceName: null,
    experienceLevel: null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    salaryPeriod: null,
    description: null,
    requirements: null,
    benefits: null,
    postedAt: null,
    sourceUrl: `https://example.com/jobs/${id}`,
  };
}

describe("useInfiniteJobs", () => {
  beforeEach(() => {
    fetchJobsPageMock.mockReset();
    trackSearchMock.mockReset();
  });

  it("seeds jobs/hasMore from initial props and does not fetch on mount", () => {
    const initialJobs = [makeJob("1")];
    const { result } = renderHook(() =>
      useInfiniteJobs({ filters: {}, initialJobs, initialHasMore: true })
    );

    expect(result.current.jobs).toEqual(initialJobs);
    expect(result.current.hasMore).toBe(true);
    expect(fetchJobsPageMock).not.toHaveBeenCalled();
  });

  it("refetches page 1 with offset 0 and replaces jobs when filters change", async () => {
    fetchJobsPageMock.mockResolvedValueOnce({ items: [makeJob("new")], hasMore: false });
    const { result, rerender } = renderHook(
      ({ filters }: { filters: InfiniteJobsFilters }) =>
        useInfiniteJobs({ filters, initialJobs: [makeJob("old")], initialHasMore: true }),
      { initialProps: { filters: {} as InfiniteJobsFilters } }
    );

    rerender({ filters: { q: "engineer" } });

    await waitFor(() => expect(result.current.jobs).toEqual([makeJob("new")]));
    expect(fetchJobsPageMock).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 0, q: "engineer" })
    );
  });

  it("loadMore appends results and requests offset = current jobs.length", async () => {
    fetchJobsPageMock.mockResolvedValueOnce({ items: [makeJob("2")], hasMore: false });
    const { result } = renderHook(() =>
      useInfiniteJobs({ filters: {}, initialJobs: [makeJob("1")], initialHasMore: true })
    );

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.jobs).toEqual([makeJob("1"), makeJob("2")]);
    expect(result.current.hasMore).toBe(false);
    expect(fetchJobsPageMock).toHaveBeenCalledWith(expect.objectContaining({ offset: 1 }));
  });

  it("loadMore is a no-op when hasMore is false", async () => {
    const { result } = renderHook(() =>
      useInfiniteJobs({ filters: {}, initialJobs: [], initialHasMore: false })
    );

    await act(async () => {
      await result.current.loadMore();
    });

    expect(fetchJobsPageMock).not.toHaveBeenCalled();
  });

  it("loadMore is a no-op while a refetch is already in flight", async () => {
    let resolveFetch: (value: { items: Job[]; hasMore: boolean }) => void = () => {};
    fetchJobsPageMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );
    const { result, rerender } = renderHook(
      ({ filters }: { filters: InfiniteJobsFilters }) =>
        useInfiniteJobs({ filters, initialJobs: [makeJob("1")], initialHasMore: true }),
      { initialProps: { filters: {} as InfiniteJobsFilters } }
    );

    rerender({ filters: { q: "engineer" } });
    await waitFor(() => expect(result.current.isLoading).toBe(true));

    await act(async () => {
      await result.current.loadMore();
    });
    expect(fetchJobsPageMock).toHaveBeenCalledOnce();

    await act(async () => {
      resolveFetch({ items: [], hasMore: false });
    });
  });

  it("tracks a search with isZeroResult when a filtered query returns no items", async () => {
    fetchJobsPageMock.mockResolvedValueOnce({ items: [], hasMore: false });
    const { rerender } = renderHook(
      ({ filters }: { filters: InfiniteJobsFilters }) =>
        useInfiniteJobs({ filters, initialJobs: [], initialHasMore: false }),
      { initialProps: { filters: {} as InfiniteJobsFilters } }
    );

    rerender({ filters: { q: "nonexistent" } });

    await waitFor(() => expect(trackSearchMock).toHaveBeenCalledOnce());
    expect(trackSearchMock).toHaveBeenCalledWith(
      expect.objectContaining({ query: "nonexistent", isZeroResult: true })
    );
  });

  it("does not track a search when filters.q is empty", async () => {
    fetchJobsPageMock.mockResolvedValueOnce({ items: [makeJob("x")], hasMore: false });
    const { rerender } = renderHook(
      ({ filters }: { filters: InfiniteJobsFilters }) =>
        useInfiniteJobs({ filters, initialJobs: [], initialHasMore: false }),
      { initialProps: { filters: {} as InfiniteJobsFilters } }
    );

    rerender({ filters: { categoryIds: ["cat-1"] } });

    await waitFor(() => expect(fetchJobsPageMock).toHaveBeenCalledOnce());
    expect(trackSearchMock).not.toHaveBeenCalled();
  });

  it("catches a rejected refetch without crashing and resets isLoading", async () => {
    fetchJobsPageMock.mockRejectedValueOnce(new Error("network error"));
    const { result, rerender } = renderHook(
      ({ filters }: { filters: InfiniteJobsFilters }) =>
        useInfiniteJobs({ filters, initialJobs: [makeJob("1")], initialHasMore: true }),
      { initialProps: { filters: {} as InfiniteJobsFilters } }
    );

    rerender({ filters: { q: "engineer" } });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.jobs).toEqual([makeJob("1")]);
  });
});
