"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AiMatchCta } from "@/components/nav/ai-match-cta";

const NAV_LINKS = [
  { label: "Jobs", href: "/jobs" },
  { label: "Companies", href: "#" },
  { label: "Salaries", href: "#" },
  { label: "Blog", href: "#" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="relative z-[6] px-5 py-[26px] sm:px-10">
      <div className="flex items-center gap-[18px]">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <div className="flex size-[34px] items-center justify-center rounded-[10px] bg-[#ffb84d] shadow-[0_6px_16px_rgba(255,184,77,0.4)]">
            <div className="size-3 rotate-45 rounded-[3px] bg-[#06222b]" />
          </div>
          <span className="text-[21px] font-extrabold tracking-tight text-[#f6f0e2]">Hatch</span>
        </Link>

        <div className="ml-1.5 hidden items-center gap-[30px] md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[15px] font-semibold text-[#dfeaea]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto hidden items-center gap-[18px] md:flex">
          <AiMatchCta />
          <Link
            href="/jobs"
            className="rounded-[30px] bg-[#ffb84d] px-6 py-3 text-[15px] font-bold text-[#06222b] shadow-[0_8px_22px_rgba(255,184,77,0.32)] transition-transform hover:-translate-y-px"
          >
            Browse Jobs
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-3 md:hidden">
          <Link
            href="/jobs"
            className="rounded-[30px] bg-[#ffb84d] px-4 py-2 text-sm font-bold text-[#06222b] shadow-[0_8px_22px_rgba(255,184,77,0.32)]"
          >
            Browse Jobs
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="flex size-9 items-center justify-center rounded-full border border-white/[0.18] bg-white/10 text-[#f6f0e2]"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 flex flex-col gap-1 rounded-2xl border border-white/[0.14] bg-[#08262e]/95 p-4 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-[15px] font-semibold text-[#dfeaea]"
            >
              {link.label}
            </Link>
          ))}
          <div className="my-1 h-px bg-white/10" />
          <Link
            href="#"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2.5 text-[15px] font-semibold text-[#f6f0e2]"
          >
            Log In
          </Link>
          <AiMatchCta className="mt-1 w-full justify-center" onClick={() => setOpen(false)} />
        </div>
      )}
    </nav>
  );
}
