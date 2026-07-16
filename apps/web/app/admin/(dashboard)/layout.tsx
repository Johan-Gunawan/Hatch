import { LogoutButton } from "@/components/admin/logout-button";
import Link from "next/link";

export default function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#07222b] text-[#f7f1e3]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#08262e]/78 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3.5">
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="flex size-7.5 items-center justify-center rounded-[9px] bg-[#ffb84d]">
              <div className="size-2.5 rotate-45 rounded-[3px] bg-[#06222b]" />
            </div>
            <span className="text-[19px] font-bold tracking-tight">Hatch Admin</span>
          </div>

          <nav className="ml-2 flex items-center gap-1.5">
            <Link
              href="/admin"
              className="rounded-[9px] px-3 py-2 text-[13px] font-semibold text-[#9fbabb] transition-colors hover:bg-white/6 hover:text-[#f7f1e3]"
            >
              Overview
            </Link>
            <Link
              href="/admin/scrape-monitoring"
              className="rounded-[9px] px-3 py-2 text-[13px] font-semibold text-[#9fbabb] transition-colors hover:bg-white/6 hover:text-[#f7f1e3]"
            >
              Scrape Monitoring
            </Link>
          </nav>

          <div className="ml-auto">
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
    </div>
  );
}
