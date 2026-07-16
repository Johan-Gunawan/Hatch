import type { DailyTrendPoint } from "@/api/analytics.read";

interface OverviewCardsProps {
  dailyTrend: DailyTrendPoint[];
}

const NUMBER_FORMAT = new Intl.NumberFormat("en-US");

interface CardSpec {
  label: string;
  values: number[];
  accent: string;
}

function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

// Minimal inline SVG sparkline, no charting library — a single normalized
// polyline across the day-by-day values for this stat.
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length === 0 || values.every((v) => v === 0)) {
    return <div className="h-8 w-full" />;
  }

  const width = 100;
  const height = 28;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = values.length === 1 ? width : (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-8 w-full"
      aria-hidden="true"
    >
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
}

export function OverviewCards({ dailyTrend }: OverviewCardsProps) {
  const cards: CardSpec[] = [
    {
      label: "Total Visits",
      values: dailyTrend.map((d) => d.visitCount),
      accent: "#ffb84d",
    },
    {
      label: "Unique Visitors",
      values: dailyTrend.map((d) => d.uniqueVisitorCount),
      accent: "#36d6a6",
    },
    {
      label: "Total Searches",
      values: dailyTrend.map((d) => d.searchCount),
      accent: "#7fb8ff",
    },
    {
      label: "Total Apply Clicks",
      values: dailyTrend.map((d) => d.applyClickCount),
      accent: "#36d6a6",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-white/10 bg-[#0c3540] p-4.5">
          <div className="text-[12px] font-semibold uppercase tracking-wide text-[#7f9698]">
            {card.label}
          </div>
          <div className="mt-1.5 text-[28px] font-bold tracking-tight text-[#f7f1e3]">
            {NUMBER_FORMAT.format(sum(card.values))}
          </div>
          <div className="mt-3">
            <Sparkline values={card.values} color={card.accent} />
          </div>
        </div>
      ))}
    </div>
  );
}
