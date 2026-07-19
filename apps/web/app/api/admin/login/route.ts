import { ApiError } from "@/api/client";
import { serverFetch } from "@/api/server-client";
import { signAdminSession } from "@/lib/admin-session";
import { env } from "@/lib/env";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE_SECONDS = 86400;

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!password) {
    console.log("admin-login:rejected", JSON.stringify({}));
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  try {
    // Regular (non-admin) API key on purpose: the admin key is exempted from
    // the backend's per-IP rate limiter, which would let password guesses
    // bypass throttling entirely.
    await serverFetch<{ ok: boolean }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  } catch (err) {
    console.log("admin-login:rejected", JSON.stringify({}));
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  const sessionCookie = signAdminSession();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });

  console.log("admin-login:accepted", JSON.stringify({}));
  return NextResponse.json({ ok: true });
}
