"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FeedZoekbalk() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function zoek(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/zoeken?q=${encodeURIComponent(query.trim())}`);
    setQuery("");
  }

  return (
    <form onSubmit={zoek} className="mb-6">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Zoek een album of artiest..."
        className="w-full bg-stone-900 border border-stone-700/60 rounded-2xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors"
      />
    </form>
  );
}
