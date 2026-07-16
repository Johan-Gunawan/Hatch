"use client";

import type { JobListParams, JobSortBy } from "@/components/jobs/job-board-data";
import { useEffect, useState } from "react";

export type { JobSortBy };

const SEARCH_DEBOUNCE_MS = 300;

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

export type ResolvedJobFilters = Omit<JobListParams, "isActive" | "limit" | "offset">;

interface UseJobFiltersResult {
  query: string;
  setQuery: (value: string) => void;
  categoryIds: string[];
  toggleCategory: (id: string) => void;
  workArrangementIds: string[];
  toggleWorkArrangement: (id: string) => void;
  locations: string[];
  toggleLocation: (value: string) => void;
  companies: string[];
  toggleCompany: (value: string) => void;
  minSalary: number;
  setMinSalary: (value: number) => void;
  sortBy: JobSortBy;
  setSortBy: (value: JobSortBy) => void;
  hasActive: boolean;
  clearAll: () => void;
  filters: ResolvedJobFilters;
}

// Owns the jobs board's filter/search/sort UI state. The search query is
// debounced before it's exposed in `filters` so the consumer (useInfiniteJobs)
// only refetches once typing settles, not on every keystroke.
export function useJobFilters(): UseJobFiltersResult {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [workArrangementIds, setWorkArrangementIds] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [minSalary, setMinSalary] = useState(0);
  const [sortBy, setSortBy] = useState<JobSortBy>("relevance");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query]);

  function toggleCategory(id: string): void {
    console.log("use-job-filters:toggleCategory", JSON.stringify({ id }));
    setCategoryIds((prev) => toggleValue(prev, id));
  }

  function toggleWorkArrangement(id: string): void {
    console.log("use-job-filters:toggleWorkArrangement", JSON.stringify({ id }));
    setWorkArrangementIds((prev) => toggleValue(prev, id));
  }

  function toggleLocation(value: string): void {
    console.log("use-job-filters:toggleLocation", JSON.stringify({ value }));
    setLocations((prev) => toggleValue(prev, value));
  }

  function toggleCompany(value: string): void {
    console.log("use-job-filters:toggleCompany", JSON.stringify({ value }));
    setCompanies((prev) => toggleValue(prev, value));
  }

  function clearAll(): void {
    console.log("use-job-filters:clearAll", JSON.stringify({}));
    setQuery("");
    setCategoryIds([]);
    setWorkArrangementIds([]);
    setLocations([]);
    setCompanies([]);
    setMinSalary(0);
  }

  const hasActive =
    categoryIds.length > 0 ||
    workArrangementIds.length > 0 ||
    locations.length > 0 ||
    companies.length > 0 ||
    minSalary > 0;

  const filters: ResolvedJobFilters = {
    q: debouncedQuery || undefined,
    categoryIds,
    workArrangementIds,
    locations,
    companies,
    minSalary: minSalary > 0 ? minSalary : undefined,
    sortBy,
  };

  return {
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
  };
}
