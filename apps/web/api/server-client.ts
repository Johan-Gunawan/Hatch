import "server-only";
import { ApiError } from "./client";

// Server-only fetch wrapper. Injects the API key from a non-public env var so it
// never reaches the browser. All landing/job-board reads go through here.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const API_KEY = process.env.API_KEY ?? "dev-secret-key";
// Admin-only key, sent only by calls that originate from the admin dashboard
// (scrape triggers/monitoring, analytics) — the backend exempts this key from
// its per-IP rate limiter. Never expose this to the browser.
const ADMIN_API_KEY = process.env.ADMIN_API_KEY ?? "dev-admin-secret-key";

export interface ServerFetchOptions extends RequestInit {
  admin?: boolean;
}

export async function serverFetch<T>(path: string, init?: ServerFetchOptions): Promise<T> {
  console.log("server-fetch", JSON.stringify({ path, admin: Boolean(init?.admin) }));
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": init?.admin ? ADMIN_API_KEY : API_KEY,
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const rawError = body?.error;
    const message = typeof rawError === "string" ? rawError : (rawError?.message ?? res.statusText);
    throw new ApiError(message, res.status);
  }

  return res.json() as Promise<T>;
}
