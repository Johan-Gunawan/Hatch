import { verifyAdminSession } from "@/lib/admin-session";
import { type NextRequest, NextResponse } from "next/server";

// node:crypto (used by verifyAdminSession) requires the Node.js runtime —
// Middleware defaults to the Edge runtime, which doesn't support it.
export const runtime = "nodejs";

// Admin-privileged route handlers (they forward requests to the backend with
// the admin API key) — these have no UI of their own, so a failed check
// returns 401 JSON instead of redirecting to the login page.
const ADMIN_API_ROUTES = [
  "/api/jobs/scrape",
  "/api/jobs/sources",
  "/api/companies/scrape",
  "/api/analytics/rollup",
];

// Broad matcher; the exact admin/public split happens inside the function
// below, since Next's literal-string matcher entries do not reliably behave
// as exact-path matches (verified: "/api/jobs/scrape" as a matcher entry also
// intercepted "/api/jobs", a public route — this allowlist check avoids that).
export const config = { matcher: ["/admin/:path*", "/api/:path*"] };

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const isAdminPage = pathname.startsWith("/admin/") || pathname === "/admin";
  const isAdminApiRoute = ADMIN_API_ROUTES.includes(pathname);
  if (!isAdminPage && !isAdminApiRoute) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("admin_session")?.value;
  const isValid = verifyAdminSession(sessionCookie);

  console.log("admin-middleware", JSON.stringify({ path: pathname, isValid }));

  if (!isValid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}
