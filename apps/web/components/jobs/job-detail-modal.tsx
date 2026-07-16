"use client";

import { trackApplyClick } from "@/api/track";
import type { Job } from "@/components/jobs/job-board-data";
import {
  companyColor,
  postedLabel,
  salaryInfo,
  toBullets,
} from "@/components/jobs/job-board-utils";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Star, X } from "lucide-react";

interface JobDetailModalProps {
  job: Job;
  saved: boolean;
  applied: boolean;
  onClose: () => void;
  onToggleSave: () => void;
  onMarkApplied: () => void;
}

export function JobDetailModal({
  job,
  saved,
  applied,
  onClose,
  onToggleSave,
  onMarkApplied,
}: JobDetailModalProps) {
  const sal = salaryInfo(job);
  const requirements = toBullets(job.requirements);
  const benefits = toBullets(job.benefits);

  const details = [
    { k: "Salary", v: sal.label },
    { k: "Location", v: job.locationLabel ?? "Not specified" },
    { k: "Work type", v: job.workArrangementName ?? "Not specified" },
    { k: "Category", v: job.categoryName ?? "Not specified" },
    { k: "Posted", v: postedLabel(job.postedAt) },
  ];

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-6">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-pointer animate-in fade-in bg-[#041218]/62 duration-200 backdrop-blur-[3px]"
      />
      <div className="animate-in fade-in slide-in-from-bottom-4 relative max-h-[88vh] w-[540px] max-w-full overflow-auto rounded-[20px] border border-white/12 bg-[#0c3540] p-6.5 shadow-[0_30px_80px_rgba(0,0,0,0.5)] duration-200">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4.5 top-4.5 flex size-8.5 cursor-pointer items-center justify-center rounded-[9px] border border-white/12 bg-white/6 text-[#9fbabb]"
        >
          <X className="size-4.5" />
        </button>

        <div className="flex items-center gap-3.5 pr-10">
          {job.companyLogoUrl ? (
            <img
              src={job.companyLogoUrl}
              alt={job.companyName}
              className="size-13 shrink-0 rounded-[13px] object-cover"
            />
          ) : (
            <div
              className="flex size-13 shrink-0 items-center justify-center rounded-[13px] text-[22px] font-bold text-white"
              style={{ background: companyColor(job.companyName) }}
            >
              {job.companyName[0]}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-mono text-[13px] font-medium text-[#9fbabb]">
              {job.companyName}
            </div>
            <div className="mt-0.5 text-[21px] font-bold leading-tight tracking-tight text-[#f7f1e3]">
              {job.title}
            </div>
          </div>
        </div>

        {applied && (
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#36d6a6]/40 bg-[#36d6a6]/16 px-3 py-1.5 text-[13px] font-semibold text-[#4fe0b0]">
            ✓ You opened this application
          </div>
        )}

        <div className="mt-5.5 grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-white/8 bg-white/8">
          {details.map((d) => (
            <div key={d.k} className="bg-[#0c3540] px-4 py-3.5">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[#7f9698]">
                {d.k}
              </div>
              <div className="mt-1 text-[14.5px] font-semibold text-[#f7f1e3]">{d.v}</div>
            </div>
          ))}
        </div>

        {job.description && (
          <div className="mt-5.5">
            <div className="mb-2 text-[13px] font-bold uppercase tracking-wide text-[#9fbabb]">
              Description
            </div>
            <p className="text-[14.5px] leading-relaxed text-[#cfe0e0]">{job.description}</p>
          </div>
        )}

        {requirements.length > 0 && (
          <div className="mt-5.5">
            <div className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-[#9fbabb]">
              Requirements
            </div>
            <div className="flex flex-col gap-2.5">
              {requirements.map((r) => (
                <div key={r} className="flex items-start gap-2.5">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#ffb84d]" />
                  <span className="text-sm leading-relaxed text-[#cfe0e0]">{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {benefits.length > 0 && (
          <div className="mt-5.5">
            <div className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-[#9fbabb]">
              Benefits
            </div>
            <div className="flex flex-col gap-2.5">
              {benefits.map((b) => (
                <div key={b} className="flex items-start gap-2.5">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#36d6a6]" />
                  <span className="text-sm leading-relaxed text-[#cfe0e0]">{b}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={job.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              onMarkApplied();
              trackApplyClick(job.id);
            }}
            className="flex min-w-[200px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#ffb84d] px-5 py-3.5 text-[14.5px] font-bold text-[#06222b] transition-transform hover:-translate-y-px"
          >
            {applied ? `Applied on ${job.companyName}` : `Apply on ${job.companyName} site`}
            <ArrowUpRight className="size-4" />
          </a>
          <button
            type="button"
            onClick={onToggleSave}
            className={cn(
              "flex cursor-pointer shrink-0 items-center justify-center gap-1.5 rounded-xl border px-4.5 py-3.5 text-sm font-semibold",
              saved
                ? "border-[#ffb84d]/45 bg-[#ffb84d]/14 text-[#ffc164]"
                : "border-white/14 bg-white/5 text-[#cfe0e0]"
            )}
          >
            <Star className="size-4" fill={saved ? "currentColor" : "none"} />
            {saved ? "Saved" : "Save role"}
          </button>
        </div>
        <div className="mt-3 text-xs text-[#7f9698]">
          You'll be redirected to {job.companyName}'s careers site to complete your application.
        </div>
      </div>
    </div>
  );
}
