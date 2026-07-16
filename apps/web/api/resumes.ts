import type { ExplainResponse, MatchResponse } from "@/components/match/resume-match-data";
import { ApiError, apiFetch } from "./client";

// Multipart upload → the same-origin Next.js route handler parses the file to
// text and forwards it to the backend. FormData sets its own Content-Type
// boundary, so we can't use apiFetch (which forces application/json) here.
export async function uploadResume(file: File): Promise<MatchResponse> {
  const form = new FormData();
  form.append("resume", file);
  const res = await fetch("/api/resumes/match", { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.error ?? res.statusText, res.status);
  }
  return res.json() as Promise<MatchResponse>;
}

export function explainMatch(jobId: string, resumeId: string): Promise<ExplainResponse> {
  return apiFetch<ExplainResponse>(`/api/resumes/match/${jobId}/explain`, {
    method: "POST",
    body: JSON.stringify({ resumeId }),
  });
}
