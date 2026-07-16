import { ApiError } from "@/api/client";
import { serverFetch } from "@/api/server-client";
import { type NextRequest, NextResponse } from "next/server";

// Proxies the on-demand "why do I match?" explanation call to the backend,
// attaching x-api-key server-side.
export async function POST(request: NextRequest, ctx: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await ctx.params;
  const { resumeId } = (await request.json().catch(() => ({}))) as { resumeId?: string };

  if (!resumeId) {
    return NextResponse.json({ error: "resumeId is required" }, { status: 400 });
  }

  try {
    const data = await serverFetch(`/api/resumes/match/${encodeURIComponent(jobId)}/explain`, {
      method: "POST",
      body: JSON.stringify({ resumeId }),
    });
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
