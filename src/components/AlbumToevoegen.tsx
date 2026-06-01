"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { voegAlbumToeAanLijst } from "@/app/actions/profiel";

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
  const [, startTransition] = useTransition();

  async function search(q: string) {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/zoeken?q=${encodeURIComponent(q)}&type=album`);
    const data = await res.json();
    setResults(data);
    setSearching(false);
  }

  function add(album: SearchResult) {
    const key = `${album.name}__${album.artist}`;
    setAdded(prev => [...prev, key]);
    startTransition(() => voegAlbumToeAanLijst(listId, {
      album_name: album.name,
      artist_name: album.artist,
      album_image: album.image,
      album_url: album.url,
    }));
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => { setOpen(false); setQuery(""); setResults([]); setAdded([]); }}>
          <div className="bg-stone-900 border border-stone-700 rounded-3xl p-5 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-100">Add album to list</h3>
              <button onClick={() => { setOpen(false); setQuery(""); setResults([]); setAdded([]); }} className="text-stone-500 hover:text-stone-300 text-lg">×</button>
            </div>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => search(e.target.value)}
              placeholder="Search an album or artist..."
              className="w-full bg-stone-800 border border-stone-700/60 rounded-xl px-3 py-2 text-sm text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors mb-3"
            />
            {searching && (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-stone-700 border-t-[var(--accent)] rounded-full animate-spin" />
              </div>
            )}
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
