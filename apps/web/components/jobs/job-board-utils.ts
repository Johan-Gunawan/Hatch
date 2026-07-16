import type { Job, SalaryPeriod } from "@/components/jobs/job-board-data";

const SALARY_PERIOD_LABEL: Record<SalaryPeriod, string> = {
  monthly: " /mo",
  yearly: " /yr",
  daily: " /day",
  hourly: " /hr",
};

export function formatSalaryAmount(value: number, currency: string | null): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency ?? "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function salaryInfo(job: Job): { label: string; hasSalary: boolean } {
  const period = job.salaryPeriod ? SALARY_PERIOD_LABEL[job.salaryPeriod] : "";
  const fmt = (value: number) => formatSalaryAmount(value, job.salaryCurrency);

  if (job.salaryMin != null && job.salaryMax != null)
    return { label: `${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}${period}`, hasSalary: true };
  if (job.salaryMin != null)
    return { label: `From ${fmt(job.salaryMin)}${period}`, hasSalary: true };
  if (job.salaryMax != null)
    return { label: `Up to ${fmt(job.salaryMax)}${period}`, hasSalary: true };
  return { label: "Salary not disclosed", hasSalary: false };
}

export function daysSincePosted(postedAt: string | null): number | null {
  if (!postedAt) return null;
  const posted = new Date(postedAt).getTime();
  if (Number.isNaN(posted)) return null;
  return Math.max(0, Math.floor((Date.now() - posted) / 86_400_000));
}

export function postedLabel(postedAt: string | null): string {
  const days = daysSincePosted(postedAt);
  if (days == null) return "Recently posted";
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 7) return `Posted ${days} days ago`;
  const weeks = Math.floor(days / 7);
  return `Posted ${weeks} ${weeks === 1 ? "week ago" : "weeks ago"}`;
}

export function arrangementClasses(arrangement: string | null): string {
  const name = (arrangement ?? "").toLowerCase();
  if (name.includes("remote")) return "bg-[#36d6a6]/16 text-[#4fe0b0]";
  if (name.includes("hybrid")) return "bg-[#ffb84d]/14 text-[#ffc164]";
  if (name.includes("site")) return "bg-[#ffaa46]/16 text-[#ffc06b]";
  return "bg-white/6 text-[#bcd2d3]";
}

// Deterministic accent color from the company name, used when no logo is present.
const COMPANY_COLORS = [
  "#4f46e5",
  "#db2777",
  "#0891b2",
  "#16a34a",
  "#ea580c",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#be123c",
  "#0d9488",
];

export function companyColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return COMPANY_COLORS[hash % COMPANY_COLORS.length];
}

// Split a free-text requirements/benefits blob into bullet lines.
export function toBullets(text: string | null): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n|•|·|;/)
    .map((line) => line.replace(/^[-*\s]+/, "").trim())
    .filter((line) => line.length > 0);
}
