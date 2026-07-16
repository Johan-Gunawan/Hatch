export default function AdminDashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="h-7 w-56 animate-pulse rounded-md bg-white/10" />
          <div className="mt-2 h-4 w-40 animate-pulse rounded-md bg-white/5" />
        </div>
        <div className="h-9 w-64 animate-pulse rounded-[10px] bg-white/5" />
      </div>

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["visits", "visitors", "searches", "apply-clicks"].map((key) => (
            <div
              key={key}
              className="h-32 animate-pulse rounded-2xl border border-white/10 bg-[#0c3540]"
            />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-2xl border border-white/10 bg-[#0c3540]" />
        <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-[#0c3540]" />
        <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-[#0c3540]" />
      </div>
    </div>
  );
}
