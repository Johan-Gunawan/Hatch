"use client";

import { useEffect, useState } from "react";

const APPLIED_STORAGE_KEY = "hatch:applied-jobs";

interface UseAppliedJobsResult {
  applied: string[];
  markApplied: (id: string) => void;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function readStoredApplied(): string[] {
  try {
    const raw = window.localStorage.getItem(APPLIED_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return isStringArray(parsed) ? parsed : [];
  } catch (err) {
    console.log("use-applied-jobs:read-error", JSON.stringify({ error: String(err) }));
    return [];
  }
}

function writeStoredApplied(ids: string[]): void {
  try {
    window.localStorage.setItem(APPLIED_STORAGE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.log("use-applied-jobs:write-error", JSON.stringify({ error: String(err) }));
  }
}

// Owns the jobs board's applied-job-id list and mirrors it to localStorage.
// Starts empty (SSR-safe default, same reasoning as the `width` state in
// job-board.tsx) and hydrates from storage post-mount to avoid a hydration
// mismatch, then writes back on every change once hydration has completed.
export function useAppliedJobs(): UseAppliedJobsResult {
  const [applied, setApplied] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setApplied(readStoredApplied());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStoredApplied(applied);
  }, [applied, hydrated]);

  function markApplied(id: string): void {
    console.log("use-applied-jobs:markApplied", JSON.stringify({ id }));
    setApplied((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  return { applied, markApplied };
}
