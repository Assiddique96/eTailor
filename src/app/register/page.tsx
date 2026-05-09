import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/80 to-transparent p-6 dark:from-zinc-950 dark:to-zinc-950">
      <div className="mx-auto mt-16 w-full max-w-md space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">Create your tailoring shop</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Set up your store and start managing customers, orders, and employee access in minutes.</p>
        <AuthForm mode="register" />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account? <Link href="/login" className="underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
