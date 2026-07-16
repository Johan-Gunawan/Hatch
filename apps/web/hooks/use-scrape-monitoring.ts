"use client";

import { fetchJobSources } from "@/api/jobs";
import { type JobSourceMonitor, isRunInProgress } from "@/components/admin/scrape-monitoring-data";
import { useCallback, useEffect, useState } from "react";

const POLL_INTERVAL_MS = 5000;

export function useScrapeMonitoring(initialSources: JobSourceMonitor[]) {
  const [sources, setSources] = useState<JobSourceMonitor[]>(initialSources);
  const isPolling = sources.some((source) => isRunInProgress(source.latestRun));

  const refresh = useCallback(async () => {
    const next = await fetchJobSources();
    setSources(next);
  }, []);

  useEffect(() => {
    if (!isPolling) return;
    const id = setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isPolling, refresh]);

  return { sources, refresh };
}
