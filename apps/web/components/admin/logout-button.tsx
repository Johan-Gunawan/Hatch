"use client";

import { useState } from "react";

export function LogoutButton() {
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    console.log("logout-button:click", JSON.stringify({}));
    setIsPending(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      window.location.href = "/admin/login";
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="rounded-[9px] border border-white/12 bg-white/6 px-3.5 py-2 text-[13px] font-semibold text-[#cfe0e0] transition-colors hover:border-white/25 disabled:opacity-60"
    >
      {isPending ? "Logging out…" : "Log out"}
    </button>
  );
}
