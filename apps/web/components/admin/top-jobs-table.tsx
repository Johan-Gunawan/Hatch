import type { TopJobRow } from "@/api/analytics.read";

interface TopJobsTableProps {
  rows: TopJobRow[];
}

const NUMBER_FORMAT = new Intl.NumberFormat("en-US");
const PERCENT_FORMAT = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

function conversionLabel(applyClickCount: number, jobViewCount: number): string {
  if (jobViewCount === 0) return "—";
  return PERCENT_FORMAT.format(applyClickCount / jobViewCount);
}

export function TopJobsTable({ rows }: TopJobsTableProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c3540] p-5">
      <h2 className="text-[15px] font-bold text-[#f7f1e3]">Top Jobs</h2>
      <p className="mt-1 text-[13px] text-[#7f9698]">
        Ranked by Apply Clicks — intent to apply on the company's site, not confirmed applications.
      </p>

      {rows.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-[13.5px] text-[#7f9698]">
          No job activity recorded in this range yet.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wide text-[#7f9698]">
                <th scope="col" className="py-2 pr-3 font-semibold">
                  #
                </th>
                <th scope="col" className="py-2 pr-3 font-semibold">
                  Title
                </th>
                <th scope="col" className="py-2 pr-3 font-semibold">
                  Company
                </th>
                <th scope="col" className="py-2 pr-3 font-semibold">
                  Job Views
                </th>
                <th scope="col" className="py-2 pr-3 font-semibold">
                  Apply Clicks
                </th>
                <th scope="col" className="py-2 pr-3 font-semibold">
                  Conversion
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.jobId} className="border-b border-white/5 last:border-0">
                  <td className="py-2.5 pr-3 text-[#7f9698]">{i + 1}</td>
                  <td className="py-2.5 pr-3 font-medium text-[#f7f1e3]">{row.title}</td>
                  <td className="py-2.5 pr-3 text-[#9fbabb]">{row.companyName}</td>
                  <td className="py-2.5 pr-3 text-[#cfe0e0]">
                    {NUMBER_FORMAT.format(row.jobViewCount)}
                  </td>
                  <td className="py-2.5 pr-3 text-[#cfe0e0]">
                    {NUMBER_FORMAT.format(row.applyClickCount)}
                  </td>
                  <td className="py-2.5 pr-3 text-[#36d6a6]">
                    {conversionLabel(row.applyClickCount, row.jobViewCount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
