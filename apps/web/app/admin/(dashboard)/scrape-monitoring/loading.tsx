export default function ScrapeMonitoringLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <div className="h-7 w-56 animate-pulse rounded-md bg-white/10" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-white/5" />
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            {["new", "updated", "deactivated"].map((key) => (
              <div
                key={key}
                className="h-16 w-28 animate-pulse rounded-xl border border-white/10 bg-[#0c3540]"
              />
            ))}
          </div>
          <div className="h-9 w-24 animate-pulse rounded-[10px] bg-white/5" />
        </div>
        <div className="h-80 animate-pulse rounded-2xl border border-white/10 bg-[#0c3540]" />
      </div>
    </div>
  );
}
