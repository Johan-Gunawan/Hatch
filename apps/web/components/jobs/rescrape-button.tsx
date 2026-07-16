"use client";

import { triggerJobScrape } from "@/api/jobs";
import { Button } from "@/components/ui/button";
import { useTriggerScrape } from "@/hooks/use-trigger-scrape";

export function RescrapeButton() {
  const { trigger, isPending, error } = useTriggerScrape(() => triggerJobScrape());

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={trigger} disabled={isPending}>
        {isPending ? "Re-scraping..." : "Re-scrape jobs"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
