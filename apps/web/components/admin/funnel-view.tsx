import type { FunnelRow } from "@/api/analytics.read";

interface FunnelViewProps {
  funnel: FunnelRow;
}

const NUMBER_FORMAT = new Intl.NumberFormat("en-US");
const PERCENT_FORMAT = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

interface Step {
  label: string;
  count: number;
  color: string;
  conversionFromPrevious: number | null; // null when there's no meaningful denominator
}

export function FunnelView({ funnel }: FunnelViewProps) {
  const { visitCount, jobViewCount, applyClickCount } = funnel;

  const steps: Step[] = [
    { label: "Visits", count: visitCount, color: "#ffb84d", conversionFromPrevious: null },
    {
      label: "Job Views",
      count: jobViewCount,
      color: "#7fb8ff",
      conversionFromPrevious: visitCount > 0 ? jobViewCount / visitCount : null,
    },
    {
      label: "Apply Clicks",
      count: applyClickCount,
      color: "#36d6a6",
      conversionFromPrevious: jobViewCount > 0 ? applyClickCount / jobViewCount : null,
    },
  ];

  const widest = Math.max(visitCount, 1);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c3540] p-5">
      <h2 className="text-[15px] font-bold text-[#f7f1e3]">Conversion Funnel</h2>
      <p className="mt-1 text-[13px] text-[#7f9698]">
        Visits to job views to apply clicks (intent to apply — we have no visibility past the
        outbound click).
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {steps.map((step) => {
          const widthPct = Math.max((step.count / widest) * 100, step.count > 0 ? 4 : 0);
          return (
            <div key={step.label} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="font-semibold text-[#f7f1e3]">{step.label}</span>
                <span className="text-[#9fbabb]">
                  {NUMBER_FORMAT.format(step.count)}
                  {step.conversionFromPrevious !== null && (
                    <span className="ml-1.5 text-[#7f9698]">
                      ({PERCENT_FORMAT.format(step.conversionFromPrevious)} of previous step)
                    </span>
                  )}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${widthPct}%`, backgroundColor: step.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[13px] leading-relaxed text-[#cfe0e0]">
        Visits {NUMBER_FORMAT.format(visitCount)} {"→"} Job Views{" "}
        {NUMBER_FORMAT.format(jobViewCount)}{" "}
        {visitCount > 0 && (
          <span className="text-[#7f9698]">
            ({PERCENT_FORMAT.format(jobViewCount / visitCount)})
          </span>
        )}{" "}
        {"→"} Apply Clicks {NUMBER_FORMAT.format(applyClickCount)}{" "}
        {jobViewCount > 0 && (
          <span className="text-[#7f9698]">
            ({PERCENT_FORMAT.format(applyClickCount / jobViewCount)})
          </span>
        )}
      </p>
    </div>
  );
}
