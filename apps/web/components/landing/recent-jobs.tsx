import type { Job } from "@/components/jobs/job-board-data";
import { arrangementClasses, postedLabel, salaryInfo } from "@/components/jobs/job-board-utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

// Server-rendered teaser strip for the landing page — no interactivity, so it
// skips the JobCard/JobBoard client state (save/apply) entirely.
export function RecentJobs({ jobs }: { jobs: Job[] }) {
  if (jobs.length === 0) return null;

  return (
    <div className="relative z-[4] mx-6 mt-10 pb-8 sm:mx-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-[#f7f1e3]">Fresh roles</h2>
        <Link href="/jobs" className="text-[13.5px] font-semibold text-[#ffc164]">
          View all jobs →
        </Link>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5">
        {jobs.map((job) => {
          const { label: salaryLabel, hasSalary } = salaryInfo(job);
          return (
            <a
              key={job.id}
              href={job.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-2.5 rounded-[16px] border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-white/25 hover:bg-white/[0.07]"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-[12px] font-medium text-[#9fbabb]">
                  {job.companyName}
                </span>
                <ArrowUpRight className="size-3.5 shrink-0 text-[#7f9698] transition-colors group-hover:text-[#ffc164]" />
              </div>
              <span className="text-[15px] font-semibold leading-tight text-[#f7f1e3]">
                {job.title}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {job.locationLabel && (
                  <span className="rounded-md bg-white/6 px-2 py-0.5 text-[11px] text-[#bcd2d3]">
                    {job.locationLabel}
                  </span>
                )}
                {job.workArrangementName && (
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${arrangementClasses(job.workArrangementName)}`}
                  >
                    {job.workArrangementName}
                  </span>
                )}
              </div>
              <div className="mt-auto flex items-center justify-between pt-1.5">
                <span
                  className={
                    hasSalary
                      ? "font-mono text-[12.5px] font-semibold text-[#f7f1e3]"
                      : "text-[11.5px] italic text-[#7f9698]"
                  }
                >
                  {salaryLabel}
                </span>
                <span className="text-[11px] text-[#7f9698]">{postedLabel(job.postedAt)}</span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
