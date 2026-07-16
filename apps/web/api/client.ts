export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Client components must never call the backend API directly (that would require
// shipping the x-api-key to the browser). This hits same-origin Next.js Route
// Handlers (app/api/**/route.ts) instead, which attach the key server-side.
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.error ?? res.statusText, res.status);
  }

  return res.json() as Promise<T>;
}
