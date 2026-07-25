import { ApiError } from "@/api/client";
import { serverFetch } from "@/api/server-client";
import type { JobSourceMonitor } from "@/components/admin/scrape-monitoring-data";
import { maskCompanyName, maskUrl } from "@/lib/demo-mode";
import { NextResponse } from "next/server";

// Proxies the admin monitoring poll to the backend, attaching the x-api-key
// server-side via serverFetch so the key never ships to the client.
export async function GET() {
  console.log("proxy-list-job-sources", JSON.stringify({}));

  try {
    const data = await serverFetch<JobSourceMonitor[]>("/api/jobs/sources", { admin: true });
    const masked: JobSourceMonitor[] = data.map((source) => ({
      ...source,
      name: maskCompanyName(source.name),
      careerPageUrl: maskUrl(source.careerPageUrl),
    }));
    return NextResponse.json(masked, { status: 200 });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
