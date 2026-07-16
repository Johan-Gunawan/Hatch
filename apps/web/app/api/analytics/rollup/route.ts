import { serverFetch } from "@/api/server-client";
import { NextResponse } from "next/server";

export async function POST() {
  console.log("analytics-rollup-proxy:trigger", JSON.stringify({}));
  await serverFetch("/api/analytics/rollup", { method: "POST", admin: true });
  return NextResponse.json({ queued: true }, { status: 202 });
}
