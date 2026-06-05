"use client";

import { useEffect, useState, useActionState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { login } from "@/app/actions/auth";

const GREEN_VARS: Record<string, string> = {
  "--accent": "#22c55e", "--accent-hover": "#4ade80", "--accent-dark": "#15803d",
  "--accent-text": "#0c0a09", "--glow-1": "rgba(34,197,94,0.45)",
  "--glow-2": "rgba(21,128,61,0.35)", "--glow-3": "rgba(20,83,45,0.18)",
};

export default function LoginPage() {
  const [remember, setRemember] = useState(true);
  const [state, action, isPending] = useActionState(login, null);

  useEffect(() => {
    const r = document.documentElement;
    for (const [k, v] of Object.entries(GREEN_VARS)) r.style.setProperty(k, v);
  }, []);

  // Store remember preference in localStorage when form submits
  function handleSubmit() {
    if (remember) {
      localStorage.setItem("lt-remember", "1");
    } else {
      localStorage.removeItem("lt-remember");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex justify-center"><Logo size={48} /></div>
          <h1 className="text-2xl font-bold text-stone-50">Welcome back</h1>
          <p className="text-stone-500 mt-1 text-sm">Log in to your account</p>
        </div>

        <form action={action} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-stone-400 mb-1.5">Email</label>
            <input
              name="email" type="email" required
              placeholder="you@example.com"
              className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-stone-400 mb-1.5">Password</label>
            <input
              name="password" type="password" required
              placeholder="••••••••"
              className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setRemember(v => !v)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                remember ? "bg-[var(--accent)] border-[var(--accent)]" : "border-stone-600 group-hover:border-stone-400"
              }`}
            >
              {remember && <span className="text-[var(--accent-text)] text-xs font-bold">✓</span>}
            </div>
            <span className="text-sm text-stone-400 select-none">Remember me</span>
          </label>

          {state?.error && (
            <p className="text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-xl px-4 py-3">{state.error}</p>
          )}

          <button type="submit" disabled={isPending}
            className="w-full bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-[var(--accent-text)] font-bold rounded-xl px-4 py-3 transition-opacity mt-2">
            {isPending ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="text-center text-stone-600 text-sm mt-6">
          No account yet?{" "}
          <Link href="/register" className="text-[var(--accent)]">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
