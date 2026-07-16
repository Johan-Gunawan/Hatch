"use client";

import type { Job } from "@/components/jobs/job-board-data";
import { arrangementClasses, postedLabel, salaryInfo } from "@/components/jobs/job-board-utils";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface JobCardProps {
  job: Job;
  saved: boolean;
  applied: boolean;
  onToggleSave: () => void;
  onOpenDetail: () => void;
}

export function JobCard({ job, saved, applied, onToggleSave, onOpenDetail }: JobCardProps) {
  const { label: salaryLabel, hasSalary } = salaryInfo(job);
  const hasTags = !!(job.categoryName || job.locationLabel || job.workArrangementName);
  const days = job.postedAt
    ? Math.floor((Date.now() - new Date(job.postedAt).getTime()) / 86_400_000)
    : null;
  const isNew = days != null && days <= 3;

  return (
    <div
      className="group flex flex-col gap-3.5 rounded-2xl border border-white/10 bg-[#0c3540] p-5 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_12px_30px_rgba(0,0,0,0.4)] cursor-pointer"
      onClick={onOpenDetail}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[12.5px] font-medium text-[#9fbabb]">
              {job.companyName}
            </span>
            {isNew && (
              <span className="rounded-md bg-[#16a34a] px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-white">
                NEW
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[11px] text-[#7f9698]">{postedLabel(job.postedAt)}</div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
          aria-label={saved ? "Unsave role" : "Save role"}
          className={cn(
            "flex size-8.5 shrink-0 items-center justify-center rounded-[9px] border text-[#7f9698] transition-colors",
            saved
              ? "border-[#ffb84d]/45 bg-[#ffb84d]/14 text-[#ffc164]"
              : "border-white/12 bg-white/5"
          )}
        >
          <Star className="size-4" fill={saved ? "currentColor" : "none"} />
        </button>
      </div>

      <button type="button" onClick={onOpenDetail} className="cursor-pointer text-left">
        <span className="text-[17px] font-semibold leading-tight tracking-tight text-[#f7f1e3]">
          {job.title}
        </span>
      </button>

      {hasTags && (
        <div className="flex flex-wrap gap-1.5">
          {job.categoryName && (
            <span className="rounded-lg bg-white/6 px-2.5 py-1 text-xs text-[#bcd2d3]">
              {job.categoryName}
            </span>
          )}
          {job.locationLabel && (
            <span className="rounded-lg bg-white/6 px-2.5 py-1 text-xs text-[#bcd2d3]">
              {job.locationLabel}
            </span>
          )}
          {job.workArrangementName && (
            <span
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium",
                arrangementClasses(job.workArrangementName)
              )}
            >
              {job.workArrangementName}
            </span>
          )}
        </div>
      )}

      <div className="h-px bg-white/8" />

      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            hasSalary
              ? "font-mono text-sm font-semibold text-[#f7f1e3]"
              : "text-[13px] font-medium italic text-[#7f9698]"
          )}
        >
          {salaryLabel}
        </span>
        <button
          type="button"
          onClick={onOpenDetail}
          className={cn(
            "cursor-pointer rounded-[10px] border px-4 py-2 text-[13px] font-semibold transition-colors",
            applied
              ? "border-[#36d6a6]/40 bg-[#36d6a6]/16 text-[#4fe0b0]"
              : "border-[#ffb84d] bg-[#ffb84d] text-[#06222b]"
          )}
        >
          {applied ? "Applied ✓" : "Apply →"}
        </button>
      </div>
    </div>
  );
}
