// @vitest-environment node
import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The upload route extracts text from a PDF/DOCX and forwards it to the backend.
// Its direct collaborators are the two parser libs and serverFetch — mock those;
// keep @/api/client's ApiError real so the error-mapping branch works. Runs in
// the Node environment (next/server + CJS parser libs, not a DOM unit).

const pdfParseMock = vi.fn();
const mammothExtractMock = vi.fn();
const serverFetchMock = vi.fn();

vi.mock("pdf-parse/lib/pdf-parse.js", () => ({ default: pdfParseMock }));
vi.mock("mammoth", () => ({ default: { extractRawText: mammothExtractMock } }));
vi.mock("@/api/server-client", () => ({ serverFetch: serverFetchMock }));

const { POST } = await import("./route.js");
const { ApiError } = await import("@/api/client");

function requestWith(form: FormData): NextRequest {
  return new Request("http://localhost/api/resumes/match", {
    method: "POST",
    body: form,
  }) as unknown as NextRequest;
}

function fileForm(file: File): FormData {
  const form = new FormData();
  form.append("resume", file);
  return form;
}

const LONG_TEXT = "Experienced engineer. ".repeat(10); // > 50 chars after trim

beforeEach(() => {
  vi.clearAllMocks();
  pdfParseMock.mockResolvedValue({ text: LONG_TEXT });
  serverFetchMock.mockResolvedValue({ resumeId: "r1", items: [] });
});

describe("POST /api/resumes/match (upload handler)", () => {
  it("returns 400 when no file is provided", async () => {
    const res = await POST(requestWith(new FormData()));
    expect(res.status).toBe(400);
  });

  it("returns 413 when the file exceeds the size limit", async () => {
    const big = new File([new Uint8Array(11 * 1024 * 1024)], "cv.pdf", {
      type: "application/pdf",
    });
    const res = await POST(requestWith(fileForm(big)));
    expect(res.status).toBe(413);
  });

  it("returns 415 for an unsupported file type", async () => {
    const txt = new File(["hello"], "notes.txt", { type: "text/plain" });
    const res = await POST(requestWith(fileForm(txt)));
    expect(res.status).toBe(415);
  });

  it("returns 422 when the parser throws", async () => {
    pdfParseMock.mockRejectedValueOnce(new Error("corrupt pdf"));
    const pdf = new File(["%PDF"], "cv.pdf", { type: "application/pdf" });
    const res = await POST(requestWith(fileForm(pdf)));
    expect(res.status).toBe(422);
  });

  it("returns 422 when too little text is extracted", async () => {
    pdfParseMock.mockResolvedValueOnce({ text: "too short" });
    const pdf = new File(["%PDF"], "cv.pdf", { type: "application/pdf" });
    const res = await POST(requestWith(fileForm(pdf)));
    expect(res.status).toBe(422);
  });

  it("extracts a PDF, forwards { resumeText, fileName }, and returns the backend data", async () => {
    const pdf = new File(["%PDF"], "my-cv.pdf", { type: "application/pdf" });
    const res = await POST(requestWith(fileForm(pdf)));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ resumeId: "r1", items: [] });

    expect(serverFetchMock).toHaveBeenCalledOnce();
    const [path, init] = serverFetchMock.mock.calls[0];
    expect(path).toBe("/api/resumes/match");
    expect(JSON.parse((init as { body: string }).body)).toEqual({
      resumeText: LONG_TEXT.trim(),
      fileName: "my-cv.pdf",
    });
  });

  it("maps a backend ApiError to its status code", async () => {
    serverFetchMock.mockRejectedValueOnce(new ApiError("rate limited", 429));
    const pdf = new File(["%PDF"], "cv.pdf", { type: "application/pdf" });
    const res = await POST(requestWith(fileForm(pdf)));
    expect(res.status).toBe(429);
  });
});
