import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/80 to-transparent p-6 dark:from-zinc-950 dark:to-zinc-950">
      <div className="mx-auto mt-16 w-full max-w-md space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">Sign in to eTailor</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Manage customers, jobs, billing, and team operations from one secure workspace.</p>
        <AuthForm mode="login" />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Need a store account? <Link href="/register" className="underline">Register your shop</Link>
        </p>
      </div>
    </div>
  );
}
