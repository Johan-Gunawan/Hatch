"use client";

import { trackJobView } from "@/api/track";
import type { Job, JobFacetOptions } from "@/components/jobs/job-board-data";
import { formatSalaryAmount } from "@/components/jobs/job-board-utils";
import { JobCard } from "@/components/jobs/job-card";
import { JobDetailModal } from "@/components/jobs/job-detail-modal";
import { type FacetGroup, JobFiltersPanel } from "@/components/jobs/job-filters-panel";
import { AiMatchCta } from "@/components/nav/ai-match-cta";
import { useFavoriteJobs } from "@/hooks/use-favorite-jobs";
import { useInfiniteJobs } from "@/hooks/use-infinite-jobs";
import { type JobSortBy, useJobFilters } from "@/hooks/use-job-filters";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Layout = "sidebar" | "grid";

const MOBILE_BREAKPOINT = 820;

interface JobBoardProps {
  initialJobs: Job[];
  initialHasMore: boolean;
  facetOptions: JobFacetOptions;
}

export function JobBoard({ initialJobs, initialHasMore, facetOptions }: JobBoardProps) {
  const {
    query,
    setQuery,
    categoryIds,
    toggleCategory,
    workArrangementIds,
    toggleWorkArrangement,
    locations,
    toggleLocation,
    companies,
    toggleCompany,
    minSalary,
    setMinSalary,
    sortBy,
    setSortBy,
    hasActive,
    clearAll,
    filters,
  } = useJobFilters();

  const { jobs, hasMore, isLoading, loadMore } = useInfiniteJobs({
    filters,
    initialJobs,
    initialHasMore,
  });

  const { saved, toggleSaved } = useFavoriteJobs();

  const [layout, setLayout] = useState<Layout>("sidebar");
  const [applied, setApplied] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    if (openJobId != null) {
      console.log("job-board:trackJobView", JSON.stringify({ id: openJobId }));
      trackJobView(openJobId);
    }
  }, [openJobId]);

  useEffect(() => {
    setWidth(window.innerWidth);
    function handleResize() {
      setWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = width < MOBILE_BREAKPOINT;
  const showSidebar = !isMobile && layout === "sidebar";

  const categoryNameById = useMemo(
    () => new Map(facetOptions.categories.map((c) => [c.id, c.name])),
    [facetOptions]
  );
  const arrangementNameById = useMemo(
    () => new Map(facetOptions.workArrangements.map((w) => [w.id, w.name])),
    [facetOptions]
  );

  const facetGroups: FacetGroup[] = [
    {
      key: "category",
      title: "Category",
      items: facetOptions.categories.map((c) => ({
        label: c.name,
        active: categoryIds.includes(c.id),
        onToggle: () => toggleCategory(c.id),
      })),
    },
    {
      key: "arrangement",
      title: "Work arrangement",
      items: facetOptions.workArrangements.map((w) => ({
        label: w.name,
        active: workArrangementIds.includes(w.id),
        onToggle: () => toggleWorkArrangement(w.id),
      })),
    },
    {
      key: "location",
      title: "Location",
      items: facetOptions.locations.map((loc) => ({
        label: loc,
        active: locations.includes(loc),
        onToggle: () => toggleLocation(loc),
      })),
    },
    {
      key: "company",
      title: "Company",
      items: facetOptions.companies.map((c) => ({
        label: c,
        active: companies.includes(c),
        onToggle: () => toggleCompany(c),
      })),
    },
  ];

  const activeChips = [
    ...categoryIds.map((id) => ({
      label: categoryNameById.get(id) ?? id,
      remove: () => toggleCategory(id),
    })),
    ...workArrangementIds.map((id) => ({
      label: arrangementNameById.get(id) ?? id,
      remove: () => toggleWorkArrangement(id),
    })),
    ...locations.map((v) => ({ label: v, remove: () => toggleLocation(v) })),
    ...companies.map((v) => ({ label: v, remove: () => toggleCompany(v) })),
    ...(minSalary > 0
      ? [{ label: `${formatSalaryAmount(minSalary, "IDR")}+`, remove: () => setMinSalary(0) }]
      : []),
  ];

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  function markApplied(id: string) {
    console.log("job-board:markApplied", JSON.stringify({ id }));
    setApplied((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  const openJob = openJobId != null ? (jobs.find((j) => j.id === openJobId) ?? null) : null;

  return (
    <div className="min-h-screen bg-[#07222b] text-[#f7f1e3]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#08262e]/78 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-6 py-3.5">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <div className="flex size-7.5 items-center justify-center rounded-[9px] bg-[#ffb84d]">
              <div className="size-2.5 rotate-45 rounded-[3px] bg-[#06222b]" />
            </div>
            <span className="text-[19px] font-bold tracking-tight">Hatch</span>
          </Link>

          <div className="relative max-w-[520px] min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#7f9698]" />
            <input
              value={query}
              onChange={(e) => {
                console.log("job-board:o nQuery", JSON.stringify({ value: e.target.value }));
                setQuery(e.target.value);
              }}
              placeholder="Search role, company, or keyword"
              className="w-full rounded-[11px] border border-white/10 bg-[#0e3d4a] py-2.5 pl-10 pr-3.5 text-sm text-[#f7f1e3] outline-none transition-shadow focus:border-[#ffb84d] focus:ring-3 focus:ring-[#ffb84d]/25"
            />
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            <AiMatchCta
              className={cn(
                "px-4 py-2 text-[13px] font-bold gap-1.5",
                isMobile && "px-3 py-1.5 text-xs gap-1"
              )}
            />
            {!isMobile && (
              <div className="flex gap-0.5 rounded-[10px] bg-white/8 p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    console.log("job-board:setLayout", JSON.stringify({ value: "sidebar" }));
                    setLayout("sidebar");
                  }}
                  className={cn(
                    "rounded-lg px-3.5 py-1.5 text-[13px] font-semibold",
                    layout === "sidebar"
                      ? "bg-[#0e3d4a] text-[#f7f1e3] shadow-sm"
                      : "text-[#9fbabb]"
                  )}
                >
                  Sidebar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log("job-board:setLayout", JSON.stringify({ value: "grid" }));
                    setLayout("grid");
                  }}
                  className={cn(
                    "rounded-lg px-3.5 py-1.5 text-[13px] font-semibold",
                    layout === "grid" ? "bg-[#0e3d4a] text-[#f7f1e3] shadow-sm" : "text-[#9fbabb]"
                  )}
                >
                  Grid
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl items-start gap-6 px-6 py-6">
        {showSidebar && (
          <aside className="sticky top-21 max-h-[calc(100vh-5.25rem)] w-70 shrink-0 overflow-y-auto">
            <JobFiltersPanel
              facetGroups={facetGroups}
              minSalary={minSalary}
              salaryBound={facetOptions.salaryBound}
              formatSalary={(value) => formatSalaryAmount(value, "IDR")}
              onSalaryChange={(value) => {
                console.log("job-board:onSalaryChange", JSON.stringify({ value }));
                setMinSalary(value);
              }}
              hasActive={hasActive}
              onClearAll={clearAll}
            />
          </aside>
        )}

        <div className="min-w-0 flex-1">
          <div className="mb-4.5">
            <h1 className="text-2xl font-bold tracking-tight">Open roles</h1>
            <p className="mt-1 text-sm text-[#7f9698]">
              Across {facetOptions.companies.length} companies and {facetOptions.categories.length}{" "}
              categories
            </p>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            {!showSidebar && (
              <button
                type="button"
                onClick={() => {
                  console.log("job-board:openDrawer", JSON.stringify({}));
                  setDrawerOpen(true);
                }}
                className="flex items-center gap-2 rounded-[10px] border border-white/10 bg-[#0c3540] px-3.5 py-2.5 text-[13.5px] font-semibold text-[#f7f1e3] transition-colors hover:border-white/25"
              >
                <SlidersHorizontal className="size-3.5 text-[#bcd2d3]" />
                Filters
                {hasActive && (
                  <span className="flex min-w-4.5 items-center justify-center rounded-full bg-[#ffb84d] px-1.5 py-0.5 text-[11px] font-bold text-[#06222b]">
                    {activeChips.length}
                  </span>
                )}
              </button>
            )}
            <div className="text-sm text-[#9fbabb]">
              <strong className="font-semibold text-[#f7f1e3]">{jobs.length}</strong>{" "}
              {jobs.length === 1 ? "role" : "roles"} loaded
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[13px] text-[#7f9698]">Sort</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  console.log("job-board:onSortChange", JSON.stringify({ value: e.target.value }));
                  setSortBy(e.target.value as JobSortBy);
                }}
                className="cursor-pointer rounded-[9px] border border-white/10 bg-[#0e3d4a] px-2.5 py-2 text-[13px] text-[#f7f1e3] outline-none"
              >
                <option value="relevance">Relevance</option>
                <option value="newest">Newest first</option>
                <option value="salary">Salary: high to low</option>
              </select>
            </div>
          </div>

          {hasActive && (
            <div className="mb-4.5 flex flex-wrap gap-2">
              {activeChips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={chip.remove}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#ffb84d]/30 bg-[#ffb84d]/14 py-1.5 pl-2.5 pr-2 text-[12.5px] text-[#ffc164]"
                >
                  {chip.label}
                  <X className="size-3.5 text-[#ffc164]/70" />
                </button>
              ))}
            </div>
          )}

          <div
            className={cn(
              "grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 transition-opacity",
              isLoading && "opacity-50"
            )}
          >
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                saved={saved.includes(job.id)}
                applied={applied.includes(job.id)}
                onToggleSave={() => toggleSaved(job.id)}
                onOpenDetail={() => {
                  console.log("job-board:openJobDetail", JSON.stringify({ id: job.id }));
                  setOpenJobId(job.id);
                }}
              />
            ))}
          </div>

          {hasMore && !isLoading && (
            <div ref={sentinelRef} className="py-8 text-center text-[13px] text-[#7f9698]">
              Loading more roles…
            </div>
          )}

          {jobs.length === 0 && !isLoading && (
            <div className="rounded-2xl border border-dashed border-white/18 bg-[#0c3540] px-5 py-17.5 text-center">
              <div className="text-lg font-semibold text-[#f7f1e3]">
                No roles match your filters
              </div>
              <p className="mt-2 mb-4.5 text-sm text-[#7f9698]">
                Try widening your salary range or clearing a filter.
              </p>
              <button
                type="button"
                onClick={clearAll}
                className="rounded-[10px] bg-[#ffb84d] px-4.5 py-2.5 text-[13.5px] font-semibold text-[#06222b]"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-60">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 animate-in fade-in bg-[#0f1929]/42 duration-200"
          />
          <div className="animate-in slide-in-from-right absolute right-0 top-0 h-full w-86 max-w-[90vw] overflow-auto bg-[#07222b] p-4.5 shadow-[-12px_0_44px_rgba(0,0,0,0.16)] duration-200">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[18px] font-bold">Filters</span>
              <button
                type="button"
                onClick={() => {
                  console.log("job-board:closeDrawer", JSON.stringify({}));
                  setDrawerOpen(false);
                }}
                aria-label="Close filters"
                className="flex size-8.5 items-center justify-center rounded-[9px] border border-white/12 bg-[#0c3540] text-[#9fbabb]"
              >
                <X className="size-4.5" />
              </button>
            </div>
            <JobFiltersPanel
              title="Refine"
              facetGroups={facetGroups}
              minSalary={minSalary}
              salaryBound={facetOptions.salaryBound}
              formatSalary={(value) => formatSalaryAmount(value, "IDR")}
              onSalaryChange={(value) => setMinSalary(value)}
              hasActive={hasActive}
              onClearAll={clearAll}
            />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="mt-3.5 w-full rounded-[11px] bg-[#ffb84d] py-3.5 text-sm font-semibold text-[#06222b]"
            >
              Show {jobs.length} loaded {jobs.length === 1 ? "role" : "roles"}
            </button>
          </div>
        </div>
      )}

      {openJob && (
        <JobDetailModal
          job={openJob}
          saved={saved.includes(openJob.id)}
          applied={applied.includes(openJob.id)}
          onClose={() => {
            console.log("job-board:closeJobDetail", JSON.stringify({}));
            setOpenJobId(null);
          }}
          onToggleSave={() => toggleSaved(openJob.id)}
          onMarkApplied={() => markApplied(openJob.id)}
        />
      )}
    </div>
  );
}
