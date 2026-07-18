"use client";

import { explainMatch } from "@/api/resumes";
import { useState } from "react";
import {
  type ExplainResponse,
  type MatchResponse,
  type MatchedJob,
  formatSalary,
  scorePct,
} from "./resume-match-data";

interface ExplainState {
  loading: boolean;
  data: ExplainResponse | null;
  error: string | null;
}

export function MatchResults({ result }: { result: MatchResponse }) {
  const { items, resumeId, profile } = result;
  const [explanations, setExplanations] = useState<Record<string, ExplainState>>({});

  const requestExplain = async (jobId: string) => {
    if (explanations[jobId]?.loading || explanations[jobId]?.data) return;
    setExplanations((prev) => ({ ...prev, [jobId]: { loading: true, data: null, error: null } }));
    try {
      const data = await explainMatch(jobId, resumeId);
      setExplanations((prev) => ({ ...prev, [jobId]: { loading: false, data, error: null } }));
    } catch (err) {
      setExplanations((prev) => ({
        ...prev,
        [jobId]: {
          loading: false,
          data: null,
          error: err instanceof Error ? err.message : "Failed",
        },
      }));
    }
  };

  return (
    <section id="match-results" className="mx-auto mt-8 w-full max-w-[900px] px-2 pb-16">
      <header className="mb-5">
        <h2 className="text-[26px] font-extrabold tracking-tight text-[#f7f1e3]">
          Your matches <span className="text-[#9fbabb]">({items.length})</span>
        </h2>
        {profile.jobTitles.length > 0 && (
          <p className="mt-1 text-[14px] font-medium text-[#9fbabb]">
            Based on: {profile.jobTitles.slice(0, 3).join(" · ")}
          </p>
        )}
      </header>

      {items.length === 0 ? (
        <div className="rounded-[16px] border border-white/12 bg-white/5 px-6 py-10 text-center">
          <div className="text-[17px] font-bold text-[#f7f1e3]">No matches found</div>
          <p className="mt-2 text-[14px] text-[#9fbabb]">
            We couldn&apos;t surface roles for this résumé yet. New jobs are added continuously —
            check back soon.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((job) => (
            <MatchCard
              key={job.id}
              job={job}
              explain={explanations[job.id]}
              onExplain={() => requestExplain(job.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function MatchCard({
  job,
  explain,
  onExplain,
}: {
  job: MatchedJob;
  explain: ExplainState | undefined;
  onExplain: () => void;
}) {
  const pct = scorePct(job.score);
  const salary = formatSalary(job);

  return (
    <li className="rounded-[18px] border border-white/12 bg-white/[0.055] p-5 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-[17px] font-extrabold text-[#f7f1e3]">{job.title}</h3>
          <div className="mt-0.5 text-[14px] font-semibold text-[#bcd2d3]">{job.companyName}</div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-medium text-[#9fbabb]">
            {job.locationRaw && <span>{job.locationRaw}</span>}
            {salary && <span className="text-[#ffc164]">{salary}</span>}
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end">
          <span className="text-[20px] font-extrabold text-[#ffc164]">{pct}%</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#7fa0a2]">
            match
          </span>
        </div>
      </div>

      {/* score bar */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#ef9f3c] to-[#ffd587]"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onExplain}
          disabled={explain?.loading}
          className="rounded-[10px] border border-[#ffc164]/40 bg-[#ffc164]/10 px-3.5 py-2 text-[13px] font-bold text-[#ffc164] transition hover:bg-[#ffc164]/20 disabled:opacity-60"
        >
          {explain?.loading ? "Thinking…" : "Why do I match?"}
        </button>
        <a
          href={job.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[13px] font-bold text-[#9fbabb] hover:text-[#f7f1e3]"
        >
          View posting ↗
        </a>
      </div>

      {explain?.error && (
        <p className="mt-3 text-[13px] font-medium text-[#ff9a80]">{explain.error}</p>
      )}

      {explain?.data && (
        <div className="mt-3 rounded-[14px] border border-white/10 bg-black/15 p-4">
          <p className="text-[14px] font-medium leading-[1.55] text-[#e7f2f0]">
            {explain.data.summary}
          </p>
          {explain.data.strengths.length > 0 && (
            <ExplainList title="Strengths" color="#36d6a6" items={explain.data.strengths} />
          )}
          {explain.data.gaps.length > 0 && (
            <ExplainList title="Gaps" color="#ff9a80" items={explain.data.gaps} />
          )}
        </div>
      )}
    </li>
  );
}

function ExplainList({ title, color, items }: { title: string; color: string; items: string[] }) {
  return (
    <div className="mt-3">
      <div className="text-[12px] font-bold uppercase tracking-wide" style={{ color }}>
        {title}
      </div>
      <ul className="mt-1.5 flex flex-col gap-1">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-[13.5px] font-medium text-[#c4d6d6]">
            <span style={{ color }}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
