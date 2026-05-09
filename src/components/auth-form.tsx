"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Mode = "login" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function normalizeErrorMessage(errorValue: unknown) {
    if (typeof errorValue === "string") return errorValue;

    if (errorValue && typeof errorValue === "object") {
      const candidate = errorValue as {
        fieldErrors?: Record<string, string[]>;
        formErrors?: string[];
      };
      // Pull the first error message from Zod's fieldErrors
      const fieldFirstError = Object.values(candidate.fieldErrors ?? {}).flat()[0];
      if (fieldFirstError) return fieldFirstError;
      if (candidate.formErrors?.[0]) return candidate.formErrors[0];
    }

    return "An unexpected error occurred.";
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
    
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        setError(normalizeErrorMessage(result?.error));
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please check your connection.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="surface-card space-y-3 p-6">
      {mode === "register" && (
        <>
          <input 
            name="shopName" 
            placeholder="Shop Name" 
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-blue-500/30 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950" 
            required 
          />
          <input 
            name="shopSlug" 
            placeholder="shop-slug" 
            pattern="[a-z0-9-]+"
            title="Use only lowercase letters, numbers, and hyphens (no spaces)"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-blue-500/30 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950" 
            required 
          />
          <input 
            name="fullName" 
            placeholder="Your Full Name" 
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-blue-500/30 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950" 
            required 
          />
        </>
      )}
      
      <input 
        type="email" 
        name="email" 
        placeholder="Email" 
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-blue-500/30 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950" 
        required 
      />
      <input 
        type="password" 
        name="password" 
        placeholder="Password" 
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-blue-500/30 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950" 
        required 
      />

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3 rounded-md">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <button 
        type="submit"
        className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60 transition-colors" 
        disabled={loading}
      >
        {loading ? "Creating account..." : mode === "register" ? "Create Shop Account" : "Sign In"}
      </button>
    </form>
  );
}