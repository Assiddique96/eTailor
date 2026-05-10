"use client";
import { FormEvent, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Validate token on mount
  useEffect(() => {
    if (!token) { setTokenValid(false); setTokenError("No reset token found."); return; }
    fetch(`/api/auth/reset-password?token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        setTokenValid(d.valid);
        if (!d.valid) setTokenError(d.error ?? "Invalid or expired link.");
      })
      .catch(() => { setTokenValid(false); setTokenError("Failed to validate link."); });
  }, [token]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to reset password."); return; }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Loading token validation
  if (tokenValid === null) {
    return (
      <div className="card p-8 text-center space-y-3">
        <div className="skeleton h-12 w-12 rounded-full mx-auto" />
        <div className="skeleton h-4 w-40 mx-auto rounded" />
        <p className="text-sm text-muted">Validating your reset link…</p>
      </div>
    );
  }

  // Invalid token
  if (tokenValid === false) {
    return (
      <div className="card p-8 text-center space-y-4">
        <div className="h-14 w-14 rounded-full flex items-center justify-center text-2xl mx-auto" style={{ background: "var(--danger-light)" }}>
          ⚠️
        </div>
        <div>
          <h2 className="font-semibold mb-1">Link invalid or expired</h2>
          <p className="text-sm text-secondary">{tokenError}</p>
        </div>
        <Link href="/forgot-password" className="btn btn-primary w-full">
          Request a new link
        </Link>
      </div>
    );
  }

  // Success
  if (success) {
    return (
      <div className="card p-8 text-center space-y-4">
        <div className="h-14 w-14 rounded-full flex items-center justify-center text-2xl mx-auto" style={{ background: "var(--success-light)" }}>
          ✅
        </div>
        <div>
          <h2 className="font-semibold mb-1">Password reset!</h2>
          <p className="text-sm text-secondary">Your password has been updated. Redirecting you to sign in…</p>
        </div>
        <Link href="/login" className="btn btn-primary w-full">Sign in now</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-secondary">New password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          minLength={8}
          required
          autoFocus
          className="field"
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-secondary">Confirm password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat your new password"
          minLength={8}
          required
          className="field"
          autoComplete="new-password"
        />
        {confirm && password !== confirm && (
          <p className="text-xs" style={{ color: "var(--danger)" }}>Passwords do not match.</p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border px-3 py-2.5 text-sm" style={{ background: "var(--danger-light)", borderColor: "color-mix(in srgb, var(--danger) 25%, transparent)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={loading || password !== confirm}
      >
        {loading ? "Resetting…" : "Reset password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg-base)" }}>
      <div className="w-full max-w-sm space-y-6">
        <div>
          <Link href="/" className="flex items-center gap-2.5 mb-6">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">eT</div>
            <span className="text-lg font-semibold">eTailor</span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Set new password</h1>
          <p className="text-sm text-secondary mt-1">Choose a strong password for your account.</p>
        </div>

        <Suspense fallback={<div className="card p-8 text-center text-sm text-muted">Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>

        <p className="text-sm text-center text-muted">
          <Link href="/login" className="text-brand hover:underline font-medium">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
