"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TrackPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError("Tracking codes are 6 characters. Please check and try again.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/track/${trimmed}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "No order found with this tracking code.");
        return;
      }
      router.push(`/track/${trimmed}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      {/* Nav */}
      <header className="border-b" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
        <div className="mx-auto max-w-5xl px-5 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">eT</div>
            <span className="font-semibold">eTailor</span>
          </Link>
          <Link href="/login" className="btn btn-ghost btn-sm">Staff login</Link>
        </div>
      </header>

      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-md space-y-8 text-center">
          <div>
            <div className="h-16 w-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-3xl mx-auto mb-5">
              📦
            </div>
            <h1 className="text-3xl font-semibold tracking-tight mb-2">Track your order</h1>
            <p className="text-secondary">
              Enter the 6-character tracking code from your order receipt to see your order's progress.
            </p>
          </div>

          <form onSubmit={onSubmit} className="card p-6 space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-secondary">Tracking code</label>
              <input
                value={code}
                onChange={(e) => {
                  setError(null);
                  setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
                }}
                placeholder="e.g. X4K9TM"
                maxLength={6}
                required
                autoFocus
                className="field text-center font-mono text-xl tracking-[0.3em] uppercase"
                style={{ letterSpacing: "0.3em" }}
              />
              <p className="text-xs text-muted text-center">
                Your tracking code was given to you when your order was created.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border px-3 py-2.5 text-sm text-center" style={{ background: "var(--danger-light)", borderColor: "color-mix(in srgb, var(--danger) 25%, transparent)", color: "var(--danger)" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="btn btn-primary w-full"
            >
              {loading ? "Looking up…" : "Track order →"}
            </button>
          </form>

          <p className="text-xs text-muted">
            Can't find your code?{" "}
            <Link href="/contact" className="text-brand hover:underline">Contact the shop</Link>
          </p>
        </div>
      </div>

      <footer className="border-t py-5 text-center text-xs text-muted" style={{ borderColor: "var(--border)" }}>
        © {new Date().getFullYear()} eTailor · Order Tracking
      </footer>
    </div>
  );
}
