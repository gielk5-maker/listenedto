"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    // If not remembering, sign out when tab closes
    if (!remember) {
      window.addEventListener("beforeunload", () => {
        supabase.auth.signOut();
      }, { once: true });
    }

    router.push("/feed");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex justify-center"><Logo size={48} /></div>
          <h1 className="text-2xl font-bold text-stone-50">Welcome back</h1>
          <p className="text-stone-500 mt-1 text-sm">Log in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-stone-400 mb-1.5">Email</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-stone-400 mb-1.5">Password</label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          {/* Remember me */}
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

          {error && (
            <p className="text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-xl px-4 py-3">{error}</p>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-[var(--accent-text)] font-bold rounded-xl px-4 py-3 transition-opacity mt-2">
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
