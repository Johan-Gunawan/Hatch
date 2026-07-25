import { ApiError } from "@/api/client";
import { serverFetch } from "@/api/server-client";
import type { JobFacetOptions } from "@/components/jobs/job-board-data";
import { maskCompanyNames } from "@/lib/demo-mode";
import { NextResponse } from "next/server";

// Proxies the browser's facet-options fetch to the backend, attaching the
// x-api-key server-side via serverFetch so the key never ships to the client.
export async function GET() {
  console.log("proxy-job-facets", JSON.stringify({}));

  try {
    const data = await serverFetch<JobFacetOptions>("/api/jobs/facets");
    const masked: JobFacetOptions = { ...data, companies: maskCompanyNames(data.companies) };
    return NextResponse.json(masked);
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
