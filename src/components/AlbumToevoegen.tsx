"use client";

import { useState, useRef, useTransition, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { voegAlbumToeAanLijst } from "@/app/actions/profile";

type SearchResult = {
  name: string;
  artist: string;
  image: string | null;
  url: string | null;
};

export default function AlbumToevoegen({ listId }: { listId: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [added, setAdded] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();

  function handleInput(q: string) {
    setQuery(q);
    setResults([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setSearching(false); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}&type=album`);
      const data = await res.json();
      if (Array.isArray(data)) setResults(data);
      setSearching(false);
    }, 350);
  }

  function close() {
    setOpen(false);
    setQuery("");
    setResults([]);
    setAdded([]);
    setError(null);
  }

  async function add(album: SearchResult) {
    const key = `${album.name}__${album.artist}`;
    setAdded(prev => [...prev, key]);
    const result = await voegAlbumToeAanLijst(listId, {
      album_name: album.name,
      artist_name: album.artist,
      album_image: album.image,
      album_url: album.url,
    });
    if (result?.error) {
      setError(result.error);
      setAdded(prev => prev.filter(k => k !== key));
    } else {
      // Refresh list in background without closing modal or clearing search
      startTransition(() => router.refresh());
      // Clear search so user can immediately look for next album
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-[var(--accent)] hover:opacity-90 text-[var(--accent-text)] font-bold rounded-2xl px-5 py-2.5 text-sm transition-opacity"
      >
        + Add album
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={close}>
          <div className="bg-stone-900 border border-stone-700 rounded-3xl p-5 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-100">Add album to list</h3>
              <button onClick={close} className="text-stone-500 hover:text-stone-300 text-lg">×</button>
            </div>
            <div className="relative mb-3">
              <input
                ref={inputRef}
                autoFocus
                type="text"
                value={query}
                onChange={e => handleInput(e.target.value)}
                placeholder="Search an album or artist..."
                className="w-full bg-stone-800 border border-stone-700/60 rounded-xl px-3 py-2 text-sm text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-stone-700 border-t-[var(--accent)] rounded-full animate-spin" />
                </div>
              )}
            </div>
            {error && <p className="text-red-400 text-xs mb-2 bg-red-950/30 border border-red-900/50 rounded-xl px-3 py-2">{error}</p>}
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {results.map((r, i) => {
                const key = `${r.name}__${r.artist}`;
                const isAdded = added.includes(key);
                return (
                  <button
                    key={i}
                    onClick={() => !isAdded && add(r)}
                    disabled={isAdded}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 transition-colors text-left ${isAdded ? "opacity-50 cursor-default" : "hover:bg-stone-800"}`}
                  >
                    {r.image ? (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={r.image} alt={r.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-stone-800 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate text-stone-100">{r.name}</p>
                      <p className="text-xs text-stone-500 truncate">{r.artist}</p>
                    </div>
                    <span className="text-xs flex-shrink-0 text-[var(--accent)]">
                      {isAdded ? "Added ✓" : "+"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
