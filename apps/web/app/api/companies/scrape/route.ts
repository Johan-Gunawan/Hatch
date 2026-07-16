import { ApiError } from "@/api/client";
import { serverFetch } from "@/api/server-client";
import { type NextRequest, NextResponse } from "next/server";

// Proxies the browser's company-scrape trigger to the backend, attaching the
// x-api-key server-side via serverFetch so the key never ships to the client.
export async function POST(request: NextRequest) {
  const body = await request.json();

  console.log("proxy-trigger-company-scrape", JSON.stringify({ urls: body?.urls }));

  try {
    const data = await serverFetch<{ message: string }>("/api/companies/scrape", {
      method: "POST",
      body: JSON.stringify(body),
      admin: true,
    });
    return NextResponse.json(data, { status: 202 });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
