"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

const GREEN_VARS: Record<string, string> = {
  "--accent": "#22c55e", "--accent-hover": "#4ade80", "--accent-dark": "#15803d",
  "--accent-text": "#0c0a09", "--glow-1": "rgba(34,197,94,0.45)",
  "--glow-2": "rgba(21,128,61,0.35)", "--glow-3": "rgba(20,83,45,0.18)",
};

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const r = document.documentElement;
    for (const [k, v] of Object.entries(GREEN_VARS)) r.style.setProperty(k, v);
  }, []);

  async function goToRandomAlbum() {
    setLoading(true);
    try {
      const res = await fetch("/api/random-album");
      if (!res.ok) throw new Error();
      const { name, artist, image, url } = await res.json();
      const params = new URLSearchParams({ name, artist });
      if (image) params.set("image", image);
      if (url) params.set("url", url);
      router.push(`/album?${params.toString()}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex justify-center">
          <Logo size={64} />
        </div>
        <h1 className="text-4xl font-bold text-stone-50 mb-3 tracking-tight">ListenedTo</h1>
        <p className="text-stone-400 mb-10 leading-relaxed">
          Rate albums. Share your taste.<br />
          Discover what friends are listening to.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/register"
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] font-bold rounded-2xl px-7 py-3 transition-colors shadow-lg shadow-black/25"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold rounded-2xl px-7 py-3 transition-colors border border-stone-700"
          >
            Log in
          </Link>
        </div>
        <div className="mt-4 flex justify-center">
          <button
            onClick={goToRandomAlbum}
            disabled={loading}
            className="flex items-center gap-2 text-stone-400 hover:text-stone-200 transition-colors text-sm disabled:opacity-50"
          >
            <span className={loading ? "animate-spin" : ""}>🎲</span>
            {loading ? "Zoeken…" : "Random album"}
          </button>
        </div>
      </div>
    </div>
  );
}
