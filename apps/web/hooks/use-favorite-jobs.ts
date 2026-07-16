"use client";

import { useEffect, useState } from "react";

const FAVORITES_STORAGE_KEY = "hatch:saved-jobs";

interface UseFavoriteJobsResult {
  saved: string[];
  toggleSaved: (id: string) => void;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function readStoredFavorites(): string[] {
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return isStringArray(parsed) ? parsed : [];
  } catch (err) {
    console.log("use-favorite-jobs:read-error", JSON.stringify({ error: String(err) }));
    return [];
  }
}

function writeStoredFavorites(ids: string[]): void {
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.log("use-favorite-jobs:write-error", JSON.stringify({ error: String(err) }));
  }
}

// Owns the jobs board's saved-job-id list and mirrors it to localStorage.
// Starts empty (SSR-safe default, same reasoning as the `width` state in
// job-board.tsx) and hydrates from storage post-mount to avoid a hydration
// mismatch, then writes back on every change once hydration has completed.
export function useFavoriteJobs(): UseFavoriteJobsResult {
  const [saved, setSaved] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSaved(readStoredFavorites());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStoredFavorites(saved);
  }, [saved, hydrated]);

  function toggleSaved(id: string): void {
    console.log("use-favorite-jobs:toggleSaved", JSON.stringify({ id }));
    setSaved((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return { saved, toggleSaved };
}
