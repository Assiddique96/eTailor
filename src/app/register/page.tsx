import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg-base)" }}>
      <div className="w-full max-w-sm space-y-6">
        <div>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">eT</div>
            <span className="text-lg font-semibold">eTailor</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Create your shop</h1>
          <p className="text-sm text-secondary mt-1">Set up your tailoring workspace in seconds.</p>
        </div>
        <AuthForm mode="register" />
        <p className="text-sm text-muted text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-brand hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
