import { verifyAdminSession } from "@/lib/admin-session";
import { type NextRequest, NextResponse } from "next/server";

// node:crypto (used by verifyAdminSession) requires the Node.js runtime —
// Middleware defaults to the Edge runtime, which doesn't support it.
export const runtime = "nodejs";

export const config = { matcher: ["/admin/:path*"] };

export function middleware(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("admin_session")?.value;
  const isValid = verifyAdminSession(sessionCookie);

  console.log("admin-middleware", JSON.stringify({ path: request.nextUrl.pathname, isValid }));

  if (!isValid) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}
