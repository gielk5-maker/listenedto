"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Result = {
  name: string;
  artist: string;
  image: string | null;
  mbid: string | null;
  url: string;
};

export default function FeedZoekbalk() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&type=album`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setResults(data);
          setOpen(data.length > 0);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }, 350);
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function goToAlbum(item: Result) {
    const p = new URLSearchParams({
      name: item.name, artist: item.artist, type: "album",
      ...(item.image ? { image: item.image } : {}),
      ...(item.mbid ? { mbid: item.mbid } : {}),
      ...(item.url ? { url: item.url } : {}),
    });
    setQuery("");
    setOpen(false);
    router.push(`/album?${p.toString()}`);
  }

  return (
    <div ref={containerRef} className="relative mb-6">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search an album or artist..."
          className="w-full bg-stone-900 border border-stone-700/60 rounded-2xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-stone-700 border-t-[var(--accent)] rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-2 w-full bg-stone-900 border border-stone-700/60 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
          {results.slice(0, 8).map((item, i) => (
            <button
              key={i}
              onClick={() => goToAlbum(item)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-stone-800 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-800 flex-shrink-0">
                {item.image
                  ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-stone-600 text-lg">💿</div>
                }
              </div>
              <div className="min-w-0">
                <p className="text-stone-100 text-sm font-medium truncate">{item.name}</p>
                <p className="text-stone-500 text-xs truncate">{item.artist}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
