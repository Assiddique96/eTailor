"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (compact) {
    return (
      <button
        onClick={logout}
        disabled={loading}
        className="p-1.5 rounded-md text-stone-600 hover:text-stone-300 hover:bg-stone-800 transition-colors"
        title="Sign out"
        aria-label="Sign out"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    );
  }

  return (
    <button onClick={logout} disabled={loading} className="btn btn-ghost btn-sm">
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
