import { timingSafeEqual } from "node:crypto";
import { signAdminSession } from "@/lib/admin-session";
import { env } from "@/lib/env";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE_SECONDS = 86400;

function matchesPassword(provided: string): boolean {
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(env.adminPassword);
  return providedBuf.length === expectedBuf.length && timingSafeEqual(providedBuf, expectedBuf);
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!password || !matchesPassword(password)) {
    console.log("admin-login:rejected", JSON.stringify({}));
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
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
