"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RandomAlbumButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  async function go() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/random-album");
      if (!res.ok) throw new Error();
      const { name, artist, image, url } = await res.json();
      if (!name || !artist) throw new Error();
      const params = new URLSearchParams({ name, artist });
      if (image) params.set("image", image);
      if (url) params.set("url", url);
      router.push(`/album?${params.toString()}`);
    } catch {
      setError(true);
      setLoading(false);
      setTimeout(() => setError(false), 2000);
    }
  }

  return (
    <button
      onClick={go}
      disabled={loading}
      title="Random album"
      className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl border transition-colors disabled:opacity-50 ${error ? "bg-red-900/40 border-red-700/60" : "bg-stone-800 hover:bg-stone-700 border-stone-700/60"}`}
    >
      <span className={loading ? "animate-spin inline-block" : ""}>{error ? "✕" : "🎲"}</span>
    </button>
  );
}
