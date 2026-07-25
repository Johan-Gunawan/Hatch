import { listCompanies } from "@/api/companies.read";
import { listJobs } from "@/api/jobs.read";
import { getStats } from "@/api/stats";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { HeroVisual } from "@/components/landing/hero-visual";
import { Navbar } from "@/components/landing/navbar";
import { RecentJobs } from "@/components/landing/recent-jobs";
import { ArrowRight, Search } from "lucide-react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Hatch — Every Job Across Indonesia, One Search Away",
  description:
    "Hatch aggregates fresh roles from companies across Indonesia into one always-updated job feed.",
};

const POPULAR_SEARCHES = ["Remote", "Jakarta", "Engineering", "Design"];
const RECENT_JOBS_LIMIT = 6;
const SOURCED_FROM_LIMIT = 6;

// Compact stat formatting: 12480 -> "12k+", 8 -> "8+".
function formatStat(value: number): string {
  if (value >= 1000) return `${Math.floor(value / 1000)}k+`;
  return `${value}+`;
}

export default async function Home() {
  const [stats, companies, recentJobs] = await Promise.all([
    getStats(),
    listCompanies(SOURCED_FROM_LIMIT),
    listJobs({ isActive: true, limit: RECENT_JOBS_LIMIT }),
  ]);

  const STATS = [
    { value: formatStat(stats.companies), label: "companies" },
    { value: formatStat(stats.locations), label: "cities" },
    { value: formatStat(stats.activeJobs), label: "live jobs" },
  ];
  const SOURCED_FROM = companies.map((c) => c.name);

  return (
    <div
      className={`${jakarta.variable} min-h-screen p-[18px] [font-family:var(--font-jakarta)]`}
      style={{
        background:
          "radial-gradient(140% 120% at 100% 100%, #103a44 0%, #0a2c36 55%, #07222b 100%)",
      }}
    >
      <PageViewTracker path="/" />
      <div
        className="relative overflow-hidden rounded-[30px] shadow-[0_30px_80px_rgba(4,25,32,0.45)]"
        style={{
          background:
            "radial-gradient(135% 125% at 8% -8%, #2a8793 0%, #146270 24%, #0c4451 46%, #083540 68%, #05242d 100%)",
        }}
      >
        <div className="pointer-events-none absolute -top-40 -left-30 size-[620px] animate-[hatch-sun_8s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,rgba(255,186,92,0.55),rgba(255,140,90,0.18)_42%,transparent_66%)]" />
        <div className="pointer-events-none absolute -top-20 -right-15 size-[360px] rounded-full bg-[radial-gradient(circle,rgba(255,122,92,0.4),transparent_64%)]" />

        <Navbar />

        <div className="relative z-[4] flex flex-wrap items-center gap-6 px-6 pt-[18px] pb-[30px] sm:px-10 sm:pt-5 sm:pb-10">
          <div className="min-w-0 max-w-[660px] flex-[1_1_470px] sm:min-w-[300px]">
            <div className="mb-6 inline-flex items-center gap-[9px] rounded-[30px] border border-white/[0.18] bg-white/10 px-3.5 py-[7px]">
              <span className="size-2 rounded-full bg-[#36d6a6] shadow-[0_0_0_3px_rgba(54,214,166,0.25)]" />
              <span className="text-[13px] font-semibold text-[#e7f2f0]">
                Live · updated every day
              </span>
            </div>

            <h1 className="text-[40px] leading-[1.03] font-extrabold tracking-[-0.025em] text-[#f7f1e3] md:text-[62px]">
              Every Job Across Indonesia,
              <br />
              <span className="text-[#ffc164]">One Search Away.</span>
            </h1>

            <p className="mt-6 mb-8 max-w-[520px] text-[15px] leading-[1.6] font-medium text-[#bcd2d3] sm:text-[17px]">
              We pull fresh roles from{" "}
              <strong className="text-[#f7f1e3]">
                {STATS[0].value} companies across {STATS[1].value} cities
              </strong>{" "}
              — from Jakarta to Jayapura — into one always-updated feed.
            </p>

            <div className="flex max-w-[540px] flex-col gap-2 rounded-[18px] bg-white p-2 shadow-[0_18px_44px_rgba(3,22,28,0.4)] sm:flex-row sm:items-center justify-between">
              <div className="flex w-full items-center gap-2 pl-[10px] sm:pl-[18px]">
                <Search className="size-5 shrink-0 text-[#8aa0a2]" />
                <input
                  placeholder={`Search ${stats.activeJobs.toLocaleString("id-ID")}+ jobs — try “Frontend Engineer, Jakarta”`}
                  className="min-w-full flex-1 border-none bg-transparent py-2 text-sm font-medium text-[#0b2a30] outline-none"
                />
              </div>
              <Link
                href="/jobs"
                className="flex shrink-0 items-center justify-center gap-2 rounded-[13px] bg-[#ffb84d] px-6 py-[13px] text-[15px] font-bold text-[#06222b] transition-transform hover:-translate-y-px"
              >
                Search
                <ArrowRight className="size-[15px]" />
              </Link>
            </div>

            <div className="mt-[18px] flex flex-wrap items-center gap-2.5">
              <span className="text-[13.5px] font-semibold text-[#bcd2d3]">Popular:</span>
              {POPULAR_SEARCHES.map((term) => (
                <Link
                  key={term}
                  href="/jobs"
                  className="rounded-[30px] border border-white/[0.18] bg-white/10 px-3.5 py-[7px] text-[13.5px] font-semibold text-[#eaf4f3] hover:bg-white/20"
                >
                  {term}
                </Link>
              ))}
            </div>

            <div className="mt-[30px] flex flex-wrap items-center gap-[26px]">
              {STATS.map((stat, i) => (
                <div key={stat.label} className="flex items-center gap-[26px]">
                  {i > 0 && <div className="hidden h-[22px] w-px bg-white/15 sm:block" />}
                  <div className="flex items-baseline gap-2">
                    <span className="text-[22px] font-extrabold text-[#ffc164]">{stat.value}</span>
                    <span className="text-[13.5px] font-semibold text-[#bcd2d3]">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden min-w-[380px] flex-[1_1_460px] justify-center md:flex">
            <HeroVisual liveJobsLabel={STATS[2].value} />
          </div>
        </div>

        {SOURCED_FROM.length > 0 && (
          <div className="relative z-[4] mx-6 mt-2 border-t border-white/10 py-6 pb-[30px] sm:mx-10">
            <div className="mb-4 text-[12.5px] font-semibold tracking-[0.08em] text-white/[0.42] uppercase">
              Sourcing roles from
            </div>
            <div className="flex flex-wrap items-center gap-6 sm:gap-12">
              {SOURCED_FROM.map((name) => (
                <span
                  key={name}
                  className="text-xl font-extrabold tracking-tight text-[#f7f1e3]/60"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        <RecentJobs jobs={recentJobs} />
      </div>
    </div>
  );
}
