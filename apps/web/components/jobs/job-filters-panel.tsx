"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface FacetOption {
  label: string;
  active: boolean;
  onToggle: () => void;
}

export interface FacetGroup {
  key: string;
  title: string;
  items: FacetOption[];
}

interface JobFiltersPanelProps {
  facetGroups: FacetGroup[];
  minSalary: number;
  salaryBound: number;
  formatSalary: (value: number) => string;
  onSalaryChange: (value: number) => void;
  hasActive: boolean;
  onClearAll: () => void;
  title?: string;
}

export function JobFiltersPanel({
  facetGroups,
  minSalary,
  salaryBound,
  formatSalary,
  onSalaryChange,
  hasActive,
  onClearAll,
  title = "Filters",
}: JobFiltersPanelProps) {
  const step = salaryBound > 0 ? Math.max(1, Math.round(salaryBound / 22)) : 1;
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c3540] p-4.5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[15px] font-semibold text-[#f7f1e3]">{title}</span>
        {hasActive && (
          <button type="button" onClick={onClearAll} className="text-[13px] text-[#ffb84d]">
            Clear all
          </button>
        )}
      </div>

      <div className="mb-5">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="whitespace-nowrap text-[13px] font-semibold text-[#cfe0e0]">
            Minimum salary
          </span>
          <span className="font-mono text-xs text-[#ffb84d]">
            {minSalary > 0 ? `${formatSalary(minSalary)}+` : "Any"}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={salaryBound}
          step={step}
          value={minSalary}
          onChange={(e) => onSalaryChange(Number(e.target.value))}
          className="w-full accent-[#ffb84d]"
        />
        <div className="mt-1 flex justify-between font-mono text-[11px] text-[#7f9698]">
          <span>Any</span>
          <span>{formatSalary(salaryBound)}+</span>
        </div>
      </div>

      {facetGroups.map((group) => (
        <div key={group.key} className="mb-4.5">
          <div className="mb-2 text-[13px] font-semibold text-[#cfe0e0]">{group.title}</div>
          <div className="flex max-h-[198px] flex-col gap-px overflow-auto">
            {group.items.map((opt) => (
              <button
                key={opt.label}
                type="button"
                aria-pressed={opt.active}
                onClick={opt.onToggle}
                className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-white/6"
              >
                <span
                  className={cn(
                    "flex size-4.5 shrink-0 items-center justify-center rounded-[5px] border",
                    opt.active
                      ? "border-[#ffb84d] bg-[#ffb84d] text-[#06222b]"
                      : "border-white/25 bg-white/5 text-transparent"
                  )}
                >
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <span className="flex-1 text-[13.5px] text-[#cfe0e0]">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
