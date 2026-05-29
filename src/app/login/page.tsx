"use client";

import { useState } from "react";
import Logo from "@/components/Logo";
import Link from "next/link";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await login(formData);
    if (result?.error) { setError(result.error); setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4"><Logo size={48} /></div>
          <h1 className="text-2xl font-bold text-stone-50">Welcome back</h1>
          <p className="text-stone-500 mt-1 text-sm">Log in to your account</p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-stone-400 mb-1.5">Email</label>
            <input name="email" type="email" required placeholder="you@example.com"
              className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors" />
          </div>
          <div>
            <label className="block text-sm text-stone-400 mb-1.5">Password</label>
            <input name="password" type="password" required placeholder="••••••••"
              className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors" />
          </div>

          {error && <p className="text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-xl px-4 py-3">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-text)] font-bold rounded-xl px-4 py-3 transition-colors mt-2">
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="text-center text-stone-600 text-sm mt-6">
          No account yet?{" "}
          <Link href="/registreer" className="text-[var(--accent)]">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
