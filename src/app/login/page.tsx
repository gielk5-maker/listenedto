"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

const GREEN_VARS: Record<string, string> = {
  "--accent": "#22c55e", "--accent-hover": "#4ade80", "--accent-dark": "#15803d",
  "--accent-text": "#0c0a09", "--glow-1": "rgba(34,197,94,0.45)",
  "--glow-2": "rgba(21,128,61,0.35)", "--glow-3": "rgba(20,83,45,0.18)",
};

const ALL_THEMES: Record<string, Record<string, string>> = {
  green:  { "--accent":"#22c55e","--accent-hover":"#4ade80","--accent-dark":"#15803d","--accent-text":"#0c0a09","--glow-1":"rgba(34,197,94,0.45)","--glow-2":"rgba(21,128,61,0.35)","--glow-3":"rgba(20,83,45,0.18)" },
  amber:  { "--accent":"#f59e0b","--accent-hover":"#fbbf24","--accent-dark":"#ea580c","--accent-text":"#0c0a09","--glow-1":"rgba(251,146,60,0.45)","--glow-2":"rgba(245,158,11,0.35)","--glow-3":"rgba(234,88,12,0.18)" },
  red:    { "--accent":"#ef4444","--accent-hover":"#f87171","--accent-dark":"#dc2626","--accent-text":"#ffffff","--glow-1":"rgba(239,68,68,0.45)","--glow-2":"rgba(220,38,38,0.35)","--glow-3":"rgba(185,28,28,0.18)" },
  blue:   { "--accent":"#3b82f6","--accent-hover":"#60a5fa","--accent-dark":"#1d4ed8","--accent-text":"#ffffff","--glow-1":"rgba(59,130,246,0.45)","--glow-2":"rgba(29,78,216,0.35)","--glow-3":"rgba(30,64,175,0.18)" },
  yellow: { "--accent":"#eab308","--accent-hover":"#facc15","--accent-dark":"#ca8a04","--accent-text":"#0c0a09","--glow-1":"rgba(234,179,8,0.45)","--glow-2":"rgba(202,138,4,0.35)","--glow-3":"rgba(161,110,3,0.18)" },
  purple: { "--accent":"#a855f7","--accent-hover":"#c084fc","--accent-dark":"#7e22ce","--accent-text":"#ffffff","--glow-1":"rgba(168,85,247,0.45)","--glow-2":"rgba(126,34,206,0.35)","--glow-3":"rgba(107,33,168,0.18)" },
};

function applyTheme(vars: Record<string, string>) {
  const r = document.documentElement;
  for (const [k, v] of Object.entries(vars)) r.style.setProperty(k, v);
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Always show green on login page
  useEffect(() => {
    applyTheme(GREEN_VARS);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    if (!remember) {
      const keys = Object.keys(localStorage).filter(k => k.startsWith("sb-"));
      keys.forEach(k => localStorage.removeItem(k));
      sessionStorage.setItem("lt-session", "1");
    }

    // Fetch saved theme from profile and apply it
    if (data.user) {
      const { data: profiel } = await supabase
        .from("profiles").select("theme").eq("id", data.user.id).single();
      const theme = profiel?.theme ?? "green";
      const vars = ALL_THEMES[theme] ?? GREEN_VARS;
      applyTheme(vars);
      localStorage.setItem("theme", theme);
    }

    window.location.href = "/feed";
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
          <Link href="/register" className="text-[var(--accent)]">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
