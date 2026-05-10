"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); return; }
      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg-base)" }}>
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div>
          <Link href="/" className="flex items-center gap-2.5 mb-6">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">eT</div>
            <span className="text-lg font-semibold">eTailor</span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Forgot your password?</h1>
          <p className="text-sm text-secondary mt-1">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {submitted ? (
          <div className="card p-6 text-center space-y-4">
            <div className="h-14 w-14 rounded-full flex items-center justify-center text-2xl mx-auto" style={{ background: "var(--success-light)" }}>
              ✉️
            </div>
            <div>
              <h2 className="font-semibold mb-1">Check your email</h2>
              <p className="text-sm text-secondary">
                If an account exists for <strong>{email}</strong>, we've sent a password reset link. Check your inbox and spam folder.
              </p>
            </div>
            <p className="text-xs text-muted">The link expires in 1 hour.</p>
            <button
              onClick={() => { setSubmitted(false); setEmail(""); }}
              className="btn btn-ghost btn-sm w-full"
            >
              Try a different email
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="card p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-secondary">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
                className="field"
              />
            </div>

            {error && (
              <div className="rounded-lg border px-3 py-2.5 text-sm" style={{ background: "var(--danger-light)", borderColor: "color-mix(in srgb, var(--danger) 25%, transparent)", color: "var(--danger)" }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="text-sm text-center text-muted">
          Remember your password?{" "}
          <Link href="/login" className="text-brand hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
