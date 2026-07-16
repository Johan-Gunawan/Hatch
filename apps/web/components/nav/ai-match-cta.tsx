import { Sparkles } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function AiMatchCta({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href="/match"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-[30px] bg-gradient-to-r from-[#7c5cff] to-[#36d6a6] px-6 py-3 text-[15px] font-bold text-white shadow-[0_8px_22px_rgba(124,92,255,0.32)] transition-transform hover:-translate-y-px",
        className
      )}
    >
      <Sparkles className="size-4" />
      AI Match
    </Link>
  );
}
