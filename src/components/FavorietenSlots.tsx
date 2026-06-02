"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { slaFavorietOp, verwijderFavoriet } from "@/app/actions/profile";

type Favoriet = {
  position: number;
  album_name: string;
  artist_name: string;
  album_image: string | null;
  album_url: string | null;
};

type Props = {
  favorieten: Favoriet[];
  bewerkbaar: boolean;
};

type SearchResult = {
  name: string;
  artist: string;
  image: string | null;
  url: string | null;
};

export default function FavorietenSlots({ favorieten, bewerkbaar }: Props) {
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [slots, setSlots] = useState<(Favoriet | null)[]>(() => {
    const arr: (Favoriet | null)[] = [null, null, null, null];
    favorieten.forEach((f) => { arr[f.position - 1] = f; });
    return arr;
  });
  const [, startTransition] = useTransition();

  async function search(q: string) {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=album`);
    const data = await res.json();
    setResults(data);
    setSearching(false);
  }

  function pickAlbum(album: SearchResult) {
    if (activeSlot === null) return;
    const nieuw: Favoriet = {
      position: activeSlot + 1,
      album_name: album.name,
      artist_name: album.artist,
      album_image: album.image,
      album_url: album.url,
    };
    const updated = [...slots];
    updated[activeSlot] = nieuw;
    setSlots(updated);
    setActiveSlot(null);
    setQuery("");
    setResults([]);
    startTransition(() => slaFavorietOp(activeSlot + 1, {
      album_name: album.name,
      artist_name: album.artist,
      album_image: album.image,
      album_url: album.url,
    }));
  }

  function remove(i: number) {
    const updated = [...slots];
    updated[i] = null;
    setSlots(updated);
    startTransition(() => verwijderFavoriet(i + 1));
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {slots.map((fav, i) => (
          <div key={i} className="relative group">
            <button
              onClick={() => bewerkbaar && setActiveSlot(i)}
              className={`w-full rounded-xl overflow-hidden border transition-all ${
                fav
                  ? "border-stone-700/50 hover:border-[var(--accent)]/50"
                  : "border-stone-800 border-dashed bg-stone-900/60 hover:border-stone-600 hover:bg-stone-800/60"
              } ${bewerkbaar ? "cursor-pointer" : "cursor-default"}`}
              style={{ aspectRatio: "1" }}
            >
              {fav?.album_image ? (
                <div className="relative w-full h-full">
                  <Image src={fav.album_image} alt={fav.album_name} fill className="object-cover" />
                  {bewerkbaar && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-[10px] font-semibold">Change</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-stone-700 text-lg">+</span>
                </div>
              )}
            </button>
            {fav && bewerkbaar && (
              <button
                onClick={() => remove(i)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-stone-800 border border-stone-700 text-stone-400 hover:text-red-400 hover:border-red-400 transition-colors text-xs hidden group-hover:flex items-center justify-center"
              >
                ×
              </button>
            )}
            {fav && (
              <p className="text-[9px] text-stone-600 truncate mt-1 text-center leading-tight px-0.5">{fav.album_name}</p>
            )}
          </div>
        ))}
      </div>

      {/* Search modal */}
      {activeSlot !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => { setActiveSlot(null); setQuery(""); setResults([]); }}>
          <div className="bg-stone-900 border border-stone-700 rounded-3xl p-5 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-4 text-stone-100">Favourite #{activeSlot + 1}</h3>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => search(e.target.value)}
              placeholder="Search an album..."
              className="w-full bg-stone-800 border border-stone-700/60 rounded-xl px-3 py-2 text-sm text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors mb-3"
            />
            {searching && <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-stone-700 border-t-[var(--accent)] rounded-full animate-spin" /></div>}
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => pickAlbum(r)}
                  className="w-full flex items-center gap-3 hover:bg-stone-800 rounded-xl px-3 py-2 transition-colors text-left"
                >
                  {r.image ? (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={r.image} alt={r.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-stone-800 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate text-stone-100">{r.name}</p>
                    <p className="text-xs text-stone-500 truncate">{r.artist}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
