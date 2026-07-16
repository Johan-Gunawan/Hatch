"use client";

import { triggerJobScrape } from "@/api/jobs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTriggerScrape } from "@/hooks/use-trigger-scrape";
import { useState } from "react";

interface RunAllScrapeButtonProps {
  onTriggered: () => void;
}

export function RunAllScrapeButton({ onTriggered }: RunAllScrapeButtonProps) {
  const [open, setOpen] = useState(false);
  const { trigger, isPending, error } = useTriggerScrape(async () => {
    const result = await triggerJobScrape();
    onTriggered();
    return result;
  });

  async function confirm() {
    await trigger();
    setOpen(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger
          disabled={isPending}
          className="rounded-[10px] bg-[#ffb84d] px-4 py-2 text-[13px] font-semibold text-[#06222b] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Starting…" : "Run All"}
        </AlertDialogTrigger>
        <AlertDialogContent className="border-white/10 bg-[#0c3540] text-[#f7f1e3]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#f7f1e3]">
              Run scrape for all companies?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#9fbabb]">
              Sources already completed today are skipped automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-[#9fbabb] hover:bg-white/6 hover:text-[#f7f1e3]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirm}
              disabled={isPending}
              className="bg-[#ffb84d] text-[#06222b] hover:opacity-90"
            >
              Run All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {error && <p className="text-[13px] text-[#f87171]">{error}</p>}
    </div>
  );
}
