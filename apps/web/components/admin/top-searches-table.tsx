import type { TopSearchTermRow } from "@/api/analytics.read";

interface TopSearchesTableProps {
  rows: TopSearchTermRow[];
}

const NUMBER_FORMAT = new Intl.NumberFormat("en-US");

export function TopSearchesTable({ rows }: TopSearchesTableProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c3540] p-5">
      <h2 className="text-[15px] font-bold text-[#f7f1e3]">Top Search Terms</h2>
      <p className="mt-1 text-[13px] text-[#7f9698]">
        Searches with zero results are flagged demand we currently can't satisfy.
      </p>

      {rows.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-[13.5px] text-[#7f9698]">
          No searches recorded in this range yet.
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
                  Term
                </th>
                <th scope="col" className="py-2 pr-3 font-semibold">
                  Searches
                </th>
                <th scope="col" className="py-2 pr-3 font-semibold">
                  Zero-result
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.normalizedTerm} className="border-b border-white/5 last:border-0">
                  <td className="py-2.5 pr-3 text-[#7f9698]">{i + 1}</td>
                  <td className="py-2.5 pr-3 font-medium text-[#f7f1e3]">{row.normalizedTerm}</td>
                  <td className="py-2.5 pr-3 text-[#cfe0e0]">
                    {NUMBER_FORMAT.format(row.searchCount)}
                  </td>
                  <td className="py-2.5 pr-3">
                    {row.zeroResultCount > 0 ? (
                      <span className="inline-flex items-center rounded-md border border-[#ffb84d]/35 bg-[#ffb84d]/15 px-2 py-0.5 text-[12px] font-semibold text-[#ffc164]">
                        {NUMBER_FORMAT.format(row.zeroResultCount)} zero-result
                      </span>
                    ) : (
                      <span className="text-[#7f9698]">—</span>
                    )}
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
