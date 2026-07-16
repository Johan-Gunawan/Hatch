import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

// Proxies client-side analytics events to the backend's unauthenticated
// /track/event endpoint, minting/refreshing visitor_id and session_id cookies
// server-side. Client code never reads document.cookie or sends these ids itself.
const TRACK_API_URL = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/track/event`;

const VISITOR_ID_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // ~1 year
const SESSION_ID_MAX_AGE_SECONDS = 60 * 30; // 30 minutes inactivity window

export async function POST(request: NextRequest) {
  const body = await request.json();

  const cookieStore = await cookies();

  const visitorId = cookieStore.get("visitor_id")?.value ?? crypto.randomUUID();
  // Sliding renewal: re-issue the same session_id (resetting its maxAge) on every
  // call so an active session never expires mid-use. A brand-new value is only
  // minted when the browser sent none at all — that lapse is the session boundary.
  const sessionId = cookieStore.get("session_id")?.value ?? crypto.randomUUID();

  console.log("track-proxy:forward", JSON.stringify({ eventType: body.eventType }));

  try {
    const res = await fetch(TRACK_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, visitorId, sessionId }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.log(
        "track-proxy:backend-error",
        JSON.stringify({ status: res.status, body: text.slice(0, 500) })
      );
    }
  } catch (err) {
    console.log("track-proxy:error", JSON.stringify({ error: String(err) }));
  }

  const isProd = process.env.NODE_ENV === "production";
  const response = NextResponse.json({ ok: true });

  response.cookies.set("visitor_id", visitorId, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: VISITOR_ID_MAX_AGE_SECONDS,
  });
  response.cookies.set("session_id", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: SESSION_ID_MAX_AGE_SECONDS,
  });

  return response;
}
