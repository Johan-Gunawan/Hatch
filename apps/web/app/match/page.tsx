import { ResumeMatch } from "@/components/match/resume-match";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload your résumé — Hatch",
  description:
    "Upload your résumé and let Hatch's AI matching engine surface the roles you're most likely to land across Indonesia.",
};

export default function MatchPage() {
  return <ResumeMatch />;
}
