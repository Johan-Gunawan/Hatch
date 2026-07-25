import { ApiError } from "@/api/client";
import { serverFetch } from "@/api/server-client";
import type { JobListResponse } from "@/components/jobs/job-board-data";
import { maskCompanyName, maskUrl } from "@/lib/demo-mode";
import { type NextRequest, NextResponse } from "next/server";

// Proxies the browser's paginated/filtered jobs fetch to the backend, attaching
// the x-api-key server-side via serverFetch so the key never ships to the client.
export async function GET(request: NextRequest) {
  const qs = request.nextUrl.searchParams.toString();

  console.log("proxy-list-jobs", JSON.stringify({ query: qs }));

  try {
    const data = await serverFetch<JobListResponse>(`/api/jobs${qs ? `?${qs}` : ""}`);
    const masked: JobListResponse = {
      ...data,
      items: data.items.map((job) => ({
        ...job,
        companyName: maskCompanyName(job.companyName),
        sourceUrl: maskUrl(job.sourceUrl),
      })),
    };
    return NextResponse.json(masked);
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
