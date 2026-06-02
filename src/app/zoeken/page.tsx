"use client";

import { useState, useEffect, Suspense } from "react";
import Logo from "@/components/Logo";
import AlbumCover from "@/components/AlbumCover";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Result = {
  name: string;
  artist: string;
  image: string | null;
  mbid: string | null;
  url: string;
};

function ZoekenInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    const res = await fetch(`/api/zoeken?q=${encodeURIComponent(q)}&type=album`);
    const data = await res.json();
    setResults(data);
    setLoading(false);
  }

  useEffect(() => {
    const q = params.get("q");
    if (q) { setQuery(q); search(q); }
  }, [params]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    search(query);
  }

  function goToAlbum(item: Result) {
    const p = new URLSearchParams({
      name: item.name, artist: item.artist, type: "album",
      ...(item.image ? { image: item.image } : {}),
      ...(item.mbid ? { mbid: item.mbid } : {}),
      ...(item.url ? { url: item.url } : {}),
    });
    router.push(`/album?${p.toString()}`);
  }

  return (
    <div className="min-h-screen text-stone-50">
      <header className="sticky top-0 z-10 bg-stone-950/95 backdrop-blur border-b border-stone-800/60 px-5 py-3 flex items-center gap-3">
        <Link href="/feed" className="text-base font-bold tracking-tight shrink-0 flex items-center gap-2">
          <Logo />
          <span>ListenedTo</span>
        </Link>
        <form onSubmit={handleSubmit} className="flex-1 max-w-sm">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search an album or artist..."
            className="w-full bg-stone-900 border border-stone-700/60 rounded-xl px-3 py-2 text-sm text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors"
            autoFocus
          />
        </form>
        <nav className="flex items-center gap-4 ml-auto shrink-0">
          <Link href="/gebruikers" className="text-stone-500 hover:text-stone-200 text-sm transition-colors hidden sm:block">People</Link>
          <Link href="/profiel" className="text-stone-400 hover:text-stone-100 text-sm transition-colors">Profile</Link>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-stone-700 border-t-[var(--accent)] rounded-full animate-spin" />
          </div>
        )}

        {searched && results.length === 0 && !loading && (
          <p className="text-stone-600 text-center py-16">No results found.</p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {results.map((item, i) => (
            <button
              key={i}
              onClick={() => goToAlbum(item)}
              className="bg-stone-900 rounded-2xl overflow-hidden hover:bg-stone-800/80 transition-all text-left border border-stone-800/50 hover:border-stone-700 group hover:scale-[1.01]"
            >
              <div className="aspect-square bg-stone-800 relative">
                <AlbumCover src={item.image} alt={item.name} fill sizes="(max-width: 640px) 50vw, 33vw" priority={i < 6} className="object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm truncate text-stone-100">{item.name}</p>
                <p className="text-stone-500 text-xs truncate mt-0.5">{item.artist}</p>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function ZoekenPage() {
  return <Suspense><ZoekenInner /></Suspense>;
}
