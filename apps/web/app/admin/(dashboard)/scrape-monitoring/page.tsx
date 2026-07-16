import { listJobSources } from "@/api/jobs.read";
import { ScrapeMonitoringTable } from "@/components/admin/scrape-monitoring-table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Scrape Monitoring",
};

export default async function ScrapeMonitoringPage() {
  const sources = await listJobSources();

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#f7f1e3]">Scrape Monitoring</h1>
        <p className="mt-1 text-sm text-[#7f9698]">
          Per-company scrape status and vacancy counts from the latest run.
        </p>
      </div>

      <ScrapeMonitoringTable initialSources={sources} />
    </div>
  );
}
