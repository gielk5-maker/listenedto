"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RandomAlbumButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function go() {
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
    <button
      onClick={go}
      disabled={loading}
      title="Random album"
      className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700/60 transition-colors disabled:opacity-50"
    >
      <span className={loading ? "animate-spin inline-block" : ""}>🎲</span>
    </button>
  );
}
