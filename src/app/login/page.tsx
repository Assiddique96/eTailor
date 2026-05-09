import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg-base)" }}>
      <div className="w-full max-w-sm space-y-6">
        <div>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">eT</div>
            <span className="text-lg font-semibold">eTailor</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-secondary mt-1">Sign in to your shop workspace.</p>
        </div>
        <AuthForm mode="login" />
        <p className="text-sm text-muted text-center">
          New shop?{" "}
          <Link href="/register" className="text-brand hover:underline font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
