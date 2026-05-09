"use client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Mode = "login" | "register";

function normalizeError(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const c = v as { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
    return Object.values(c.fieldErrors ?? {}).flat()[0] ?? c.formErrors?.[0] ?? "An error occurred.";
  }
  return "An unexpected error occurred.";
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) { setError(normalizeError(result?.error)); return; }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4">
      {isRegister && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-secondary">Shop name</label>
            <input name="shopName" placeholder="e.g. Prestige Tailors" required className="field" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-secondary">Shop URL slug</label>
            <input
              name="shopSlug"
              placeholder="prestige-tailors"
              pattern="[a-z0-9-]+"
              title="Lowercase letters, numbers, hyphens only"
              required
              className="field font-mono text-sm"
            />
            <p className="text-xs text-muted">Used in your unique workspace URL.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-secondary">Your full name</label>
            <input name="fullName" placeholder="Jane Doe" required className="field" />
          </div>
          <hr className="divider" />
        </>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-secondary">Email</label>
        <input type="email" name="email" placeholder="you@example.com" required className="field" autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-secondary">Password</label>
        <input type="password" name="password" placeholder="••••••••" required minLength={8} className="field" autoComplete={isRegister ? "new-password" : "current-password"} />
        {isRegister && <p className="text-xs text-muted">Minimum 8 characters.</p>}
      </div>

      {error && (
        <div className="rounded-lg border px-3 py-2.5 text-sm" style={{ background: "var(--danger-light)", borderColor: "color-mix(in srgb, var(--danger) 25%, transparent)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      <button type="submit" className="btn btn-primary w-full" disabled={loading}>
        {loading
          ? isRegister ? "Creating account…" : "Signing in…"
          : isRegister ? "Create shop account" : "Sign in"
        }
      </button>
    </form>
  );
}
