"use client";

import { triggerJobScrape } from "@/api/jobs";
import { RunAllScrapeButton } from "@/components/admin/run-all-scrape-button";
import type {
  JobSourceLatestRun,
  JobSourceMonitor,
} from "@/components/admin/scrape-monitoring-data";
import { useScrapeMonitoring } from "@/hooks/use-scrape-monitoring";
import { useTriggerScrape } from "@/hooks/use-trigger-scrape";

interface ScrapeMonitoringTableProps {
  initialSources: JobSourceMonitor[];
}

const NUMBER_FORMAT = new Intl.NumberFormat("en-US");

function formatTimestamp(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ run }: { run: JobSourceLatestRun | null }) {
  if (!run) {
    return (
      <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-[#7f9698]">
        Never run
      </span>
    );
  }

  switch (run.status) {
    case "completed":
      return (
        <span className="inline-flex items-center rounded-full bg-[#36d6a6]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#36d6a6]">
          Success
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center rounded-full bg-[#f87171]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#f87171]">
          Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffb84d]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#ffb84d]">
          <span className="size-1.5 animate-pulse rounded-full bg-[#ffb84d]" />
          In Progress
        </span>
      );
  }
}

function RetryButton({ sourceId, onTriggered }: { sourceId: string; onTriggered: () => void }) {
  const { trigger, isPending, error } = useTriggerScrape(async () => {
    const result = await triggerJobScrape(sourceId);
    onTriggered();
    return result;
  });

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={trigger}
        disabled={isPending}
        className="rounded-[8px] border border-white/10 px-3 py-1.5 text-[12px] font-semibold text-[#9fbabb] transition-colors hover:bg-white/6 hover:text-[#f7f1e3] disabled:opacity-60"
      >
        {isPending ? "Retrying…" : "Retry"}
      </button>
      {error && <span className="text-[11px] text-[#f87171]">{error}</span>}
    </div>
  );
}

export function ScrapeMonitoringTable({ initialSources }: ScrapeMonitoringTableProps) {
  const { sources, refresh } = useScrapeMonitoring(initialSources);

  // latestRun is already scoped to today by the API — no client-side date filter needed.
  const totals = sources.reduce(
    (acc, source) => {
      const run = source.latestRun;
      if (run) {
        acc.inserted += run.jobsInserted;
        acc.updated += run.jobsUpdated;
        acc.deactivated += run.jobsDeactivated;
      }
      return acc;
    },
    { inserted: 0, updated: 0, deactivated: 0 }
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <SummaryStat label="New" value={totals.inserted} tone="text-[#36d6a6]" />
          <SummaryStat label="Updated" value={totals.updated} tone="text-[#cfe0e0]" />
          <SummaryStat label="Deactivated" value={totals.deactivated} tone="text-[#f87171]" />
        </div>
        <RunAllScrapeButton onTriggered={() => void refresh()} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0c3540] p-5">
        <h2 className="text-[15px] font-bold text-[#f7f1e3]">Company Sources</h2>
        <p className="mt-1 text-[13px] text-[#7f9698]">
          Latest scrape status per company career page, with vacancies added, updated, and
          deactivated in that run.
        </p>

        {sources.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-[13.5px] text-[#7f9698]">
            No active company sources yet.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-wide text-[#7f9698]">
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    Company
                  </th>
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    Started
                  </th>
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    Completed
                  </th>
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    New
                  </th>
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    Updated
                  </th>
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    Deactivated
                  </th>
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => {
                  const run = source.latestRun;
                  return (
                    <tr key={source.id} className="border-b border-white/5 last:border-0">
                      <td className="py-2.5 pr-3 font-medium text-[#f7f1e3]">{source.name}</td>
                      <td className="py-2.5 pr-3">
                        <StatusBadge run={run} />
                        {run?.status === "failed" && run.errorMessage && (
                          <p className="mt-1 max-w-xs truncate text-[11px] text-[#f87171]">
                            {run.errorMessage}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-[#9fbabb]">
                        {formatTimestamp(run?.startedAt ?? null)}
                      </td>
                      <td className="py-2.5 pr-3 text-[#9fbabb]">
                        {formatTimestamp(run?.completedAt ?? null)}
                      </td>
                      <td className="py-2.5 pr-3 text-[#36d6a6]">
                        {run ? NUMBER_FORMAT.format(run.jobsInserted) : "—"}
                      </td>
                      <td className="py-2.5 pr-3 text-[#cfe0e0]">
                        {run ? NUMBER_FORMAT.format(run.jobsUpdated) : "—"}
                      </td>
                      <td className="py-2.5 pr-3 text-[#f87171]">
                        {run ? NUMBER_FORMAT.format(run.jobsDeactivated) : "—"}
                      </td>
                      <td className="py-2.5 pr-3">
                        <RetryButton sourceId={source.id} onTriggered={() => void refresh()} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0c3540] px-4 py-2.5">
      <p className="text-[11px] uppercase tracking-wide text-[#7f9698]">{label}</p>
      <p className={`text-lg font-bold ${tone}`}>{NUMBER_FORMAT.format(value)}</p>
    </div>
  );
}
