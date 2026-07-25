import { ApiError } from "@/api/client";
import { serverFetch } from "@/api/server-client";
import type { MatchResponse } from "@/components/match/resume-match-data";
import { maskCompanyName, maskUrl } from "@/lib/demo-mode";
import mammoth from "mammoth";
import { type NextRequest, NextResponse } from "next/server";
// Import the lib entry directly — pdf-parse's index.js runs debug code that
// reads a bundled test PDF when it thinks it's the main module, which throws
// under a bundler.
import pdfParse from "pdf-parse/lib/pdf-parse.js";

// pdf-parse / mammoth are CommonJS Node libs — force the Node runtime.
export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB, matching the mockup's stated limit

// Accept a resume file (PDF/DOCX), extract its text, and forward it as JSON to
// the backend match endpoint (serverFetch attaches x-api-key server-side). The
// raw file is parsed then discarded here — the backend stays stateless-friendly.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const file = form.get("resume");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 });
  }

  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  let text = "";
  try {
    if (name.endsWith(".pdf") || file.type === "application/pdf") {
      text = (await pdfParse(buffer)).text;
    } else if (name.endsWith(".docx")) {
      text = (await mammoth.extractRawText({ buffer })).value;
    } else {
      return NextResponse.json({ error: "Only PDF or DOCX files are supported" }, { status: 415 });
    }
  } catch (err) {
    console.log("resume-upload.parse-failed", JSON.stringify({ name, error: String(err) }));
    return NextResponse.json({ error: "Could not read that file" }, { status: 422 });
  }

  const resumeText = text.trim();
  if (resumeText.length < 50) {
    return NextResponse.json(
      { error: "Couldn't extract enough text from that file" },
      { status: 422 }
    );
  }

  try {
    const data = await serverFetch<MatchResponse>("/api/resumes/match", {
      method: "POST",
      body: JSON.stringify({ resumeText, fileName: file.name }),
    });
    const masked: MatchResponse = {
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
