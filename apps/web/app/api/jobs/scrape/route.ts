import { ApiError } from "@/api/client";
import { serverFetch } from "@/api/server-client";
import { type NextRequest, NextResponse } from "next/server";

// Proxies the browser's rescrape click to the backend, attaching the x-api-key
// server-side via serverFetch so the key never ships to the client.
export async function POST(request: NextRequest) {
  const jobSourceId = request.nextUrl.searchParams.get("jobSourceId");
  const query = jobSourceId ? `?jobSourceId=${encodeURIComponent(jobSourceId)}` : "";

  console.log("proxy-trigger-job-scrape", JSON.stringify({ jobSourceId }));

  try {
    const data = await serverFetch<{ message: string }>(`/api/jobs/scrape${query}`, {
      method: "POST",
      admin: true,
    });
    return NextResponse.json(data, { status: 202 });
  } catch (err) {
    console.log(err);
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
