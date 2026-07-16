"use client";

import { useEffect, useRef, useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    passwordInputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log("admin-login-page:submit", JSON.stringify({}));
    setIsPending(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("Incorrect password");
        setIsPending(false);
        return;
      }

      window.location.href = "/admin";
    } catch {
      setError("Something went wrong. Please try again.");
      setIsPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07222b] px-6 text-[#f7f1e3]">
      <div className="w-full max-w-[400px] rounded-2xl border border-white/12 bg-[#0c3540] p-7 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex size-7.5 items-center justify-center rounded-[9px] bg-[#ffb84d]">
            <div className="size-2.5 rotate-45 rounded-[3px] bg-[#06222b]" />
          </div>
          <span className="text-[19px] font-bold tracking-tight">Hatch Admin</span>
        </div>

        <h1 className="text-xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-[#9fbabb]">Enter the admin password to continue.</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-[13px] font-semibold text-[#cfe0e0]"
            >
              Password
            </label>
            <input
              id="admin-password"
              ref={passwordInputRef}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              className="w-full rounded-[11px] border border-white/10 bg-[#0e3d4a] px-3.5 py-2.5 text-sm text-[#f7f1e3] outline-none transition-shadow focus:border-[#ffb84d] focus:ring-3 focus:ring-[#ffb84d]/25"
            />
          </div>

          {error && (
            <div role="alert" aria-live="polite" className="text-sm font-medium text-[#ff8d8d]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="mt-1 rounded-[11px] bg-[#ffb84d] py-3 text-sm font-bold text-[#06222b] transition-transform hover:-translate-y-px disabled:translate-y-0 disabled:opacity-60"
          >
            {isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
