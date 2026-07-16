"use client";

import { triggerRollup } from "@/api/analytics";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export type DashboardRangeKey = "today" | "7d" | "30d" | "custom";

interface DateRangeFilterProps {
  activeRange: DashboardRangeKey;
  customFrom?: string;
  customTo?: string;
}

const PRESETS: { key: DashboardRangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
];

export function DateRangeFilter({ activeRange, customFrom, customTo }: DateRangeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [showCustom, setShowCustom] = useState(activeRange === "custom");
  const [from, setFrom] = useState(customFrom ?? "");
  const [to, setTo] = useState(customTo ?? "");
  const [refreshState, setRefreshState] = useState<"idle" | "triggered">("idle");

  function handleRefresh() {
    console.log("date-range-filter:refresh", JSON.stringify({}));
    triggerRollup();
    setRefreshState("triggered");
    setTimeout(() => setRefreshState("idle"), 3000);
  }

  function navigate(params: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const key of ["range", "from", "to"]) next.delete(key);
    for (const [key, value] of Object.entries(params)) next.set(key, value);
    router.push(`${pathname}?${next.toString()}`);
  }

  function selectPreset(key: DashboardRangeKey) {
    console.log("date-range-filter:selectPreset", JSON.stringify({ key }));
    setShowCustom(false);
    navigate({ range: key });
  }

  function openCustom() {
    console.log("date-range-filter:openCustom", JSON.stringify({}));
    setShowCustom(true);
  }

  function submitCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!from || !to) return;
    console.log("date-range-filter:submitCustom", JSON.stringify({ from, to }));
    navigate({ range: "custom", from, to });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleRefresh}
        disabled={refreshState === "triggered"}
        className={cn(
          "rounded-[9px] border px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
          refreshState === "triggered"
            ? "border-[#36d6a6]/40 bg-[#36d6a6]/14 text-[#4fe0b0]"
            : "border-white/10 bg-[#0e3d4a] text-[#9fbabb] hover:text-[#f7f1e3]"
        )}
      >
        {refreshState === "triggered" ? "Rollup triggered" : "Refresh data"}
      </button>
      <div className="flex gap-1 rounded-[10px] border border-white/10 bg-[#0e3d4a] p-1">
        {PRESETS.map((preset) => {
          const isActive = activeRange === preset.key;
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => selectPreset(preset.key)}
              aria-pressed={isActive}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                isActive
                  ? "border border-[#ffb84d]/40 bg-[#ffb84d] text-[#06222b]"
                  : "border border-transparent text-[#9fbabb] hover:text-[#f7f1e3]"
              )}
            >
              {preset.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={openCustom}
          aria-pressed={activeRange === "custom"}
          className={cn(
            "rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
            activeRange === "custom"
              ? "border border-[#ffb84d]/40 bg-[#ffb84d] text-[#06222b]"
              : "border border-transparent text-[#9fbabb] hover:text-[#f7f1e3]"
          )}
        >
          Custom
        </button>
      </div>

      {showCustom && (
        <form onSubmit={submitCustom} className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-[13px] text-[#9fbabb]">
            From
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              max={to || undefined}
              required
              className="rounded-[9px] border border-white/10 bg-[#0e3d4a] px-2.5 py-1.5 text-[13px] text-[#f7f1e3] outline-none focus:border-[#ffb84d]"
            />
          </label>
          <label className="flex items-center gap-1.5 text-[13px] text-[#9fbabb]">
            To
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              min={from || undefined}
              required
              className="rounded-[9px] border border-white/10 bg-[#0e3d4a] px-2.5 py-1.5 text-[13px] text-[#f7f1e3] outline-none focus:border-[#ffb84d]"
            />
          </label>
          <button
            type="submit"
            className="rounded-[9px] bg-[#ffb84d] px-3.5 py-1.5 text-[13px] font-semibold text-[#06222b]"
          >
            Apply
          </button>
        </form>
      )}
    </div>
  );
}
