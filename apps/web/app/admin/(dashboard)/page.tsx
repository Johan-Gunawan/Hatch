import { getDashboardData, resolveDashboardRange } from "@/api/analytics.read";
import { DateRangeFilter } from "@/components/admin/date-range-filter";
import { FunnelView } from "@/components/admin/funnel-view";
import { OverviewCards } from "@/components/admin/overview-cards";
import { TopJobsTable } from "@/components/admin/top-jobs-table";
import { TopSearchesTable } from "@/components/admin/top-searches-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Analytics Overview",
};

interface AdminDashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const params = await searchParams;
  const { rangeKey, range } = resolveDashboardRange(params);
  const data = await getDashboardData(range);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#f7f1e3]">Analytics Overview</h1>
          <p className="mt-1 text-sm text-[#7f9698]">
            {range.from === range.to
              ? `Showing ${range.from}`
              : `Showing ${range.from} to ${range.to}`}
          </p>
        </div>
        <DateRangeFilter
          activeRange={rangeKey}
          customFrom={rangeKey === "custom" ? range.from : undefined}
          customTo={rangeKey === "custom" ? range.to : undefined}
        />
      </div>

      <div className="flex flex-col gap-6">
        <OverviewCards dailyTrend={data.dailyTrend} />
        <FunnelView funnel={data.funnel} />
        <TopSearchesTable rows={data.topSearchTerms} />
        <TopJobsTable rows={data.topJobs} />
      </div>
    </div>
  );
}
