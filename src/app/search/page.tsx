"use client";

import { useState, useEffect, Suspense } from "react";
import Logo from "@/components/Logo";
import AlbumCover from "@/components/AlbumCover";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { searchAlbums, searchArtists, type ArtistResult } from "@/lib/search";

type Result = {
  name: string;
  artist: string;
  image: string | null;
  mbid: string | null;
  url: string | null;
};

async function fetchCover(album: string, artist: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/cover?album=${encodeURIComponent(album)}&artist=${encodeURIComponent(artist)}`);
    const data = await res.json();
    return data.url ?? null;
  } catch {
    return null;
  }
}

function HandmatigForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [artist, setArtist] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [coverLoading, setCoverLoading] = useState(false);

  async function lookupCover() {
    if (!name.trim() || !artist.trim()) return;
    setCoverLoading(true);
    const url = await fetchCover(name.trim(), artist.trim());
    setPreview(url);
    setCoverLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !artist.trim()) return;
    setLoading(true);
    let image = preview;
    if (!image) image = await fetchCover(name.trim(), artist.trim());
    const p = new URLSearchParams({ name: name.trim(), artist: artist.trim(), type: "album", ...(image ? { image } : {}) });
    window.location.href = `/album?${p.toString()}`;
  }

  return (
    <div className="bg-stone-900 rounded-3xl p-6 border border-stone-800/60 space-y-4">
      <h3 className="text-sm font-bold text-stone-300">Add manually</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-stone-500 mb-1.5">Album name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={lookupCover}
            placeholder="e.g. Time Flies... 1994-2001"
            className="w-full bg-stone-800 border border-stone-700/60 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1.5">Artist</label>
          <input
            value={artist}
            onChange={e => setArtist(e.target.value)}
            onBlur={lookupCover}
            placeholder="e.g. Oasis"
            className="w-full bg-stone-800 border border-stone-700/60 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
          />
        </div>

        {(coverLoading || preview) && (
          <div className="flex items-center gap-3">
            {coverLoading
              ? <div className="w-14 h-14 rounded-xl bg-stone-800 flex items-center justify-center"><div className="w-4 h-4 border-2 border-stone-700 border-t-[var(--accent)] rounded-full animate-spin" /></div>
              : preview && <img src={preview} alt="cover" className="w-14 h-14 rounded-xl object-cover" referrerPolicy="no-referrer" />
            }
            <p className="text-stone-500 text-xs">{coverLoading ? "Looking up cover..." : "Cover found"}</p>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={loading || !name.trim() || !artist.trim()}
            className="flex-1 bg-[var(--accent)] hover:opacity-90 disabled:opacity-40 text-[var(--accent-text)] font-bold rounded-2xl px-4 py-3 transition-opacity text-sm">
            {loading ? "Loading..." : "Add album"}
          </button>
          <button type="button" onClick={onDone}
            className="px-4 py-3 text-stone-500 hover:text-stone-300 bg-stone-800 rounded-2xl text-sm transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function ZoekenInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [results, setResults] = useState<Result[]>([]);
  const [artists, setArtists] = useState<ArtistResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showManual, setShowManual] = useState(false);

  async function search(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    const [albumResults, artistResults] = await Promise.all([
      searchAlbums(q.trim()),
      searchArtists(q.trim()),
    ]);
    setResults(albumResults);
    setArtists(artistResults);
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
    window.location.href = `/album?${p.toString()}`;
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
          <Link href="/users" className="text-stone-500 hover:text-stone-200 text-sm transition-colors hidden sm:block">People</Link>
          <Link href="/profile" className="text-stone-400 hover:text-stone-100 text-sm transition-colors">Profile</Link>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-stone-700 border-t-[var(--accent)] rounded-full animate-spin" />
          </div>
        )}

        {!loading && artists.length > 0 && (
          <div>
            <h2 className="text-xs text-stone-600 uppercase tracking-widest font-semibold mb-3">Artists</h2>
            <div className="flex gap-3">
              {artists.map((artist, i) => (
                <Link
                  key={i}
                  href={`/artist?name=${encodeURIComponent(artist.name)}`}
                  className="flex flex-col items-center gap-2 group w-24"
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-stone-800 shadow-lg shadow-black/40 group-hover:opacity-80 transition-opacity">
                    {artist.image
                      ? <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-stone-600 text-2xl">🎤</div>
                    }
                  </div>
                  <p className="text-stone-300 text-xs font-medium text-center truncate w-full">{artist.name}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!loading && (
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
        )}

        {searched && !loading && (
          <div>
            {showManual ? (
              <HandmatigForm onDone={() => setShowManual(false)} />
            ) : (
              <button
                onClick={() => setShowManual(true)}
                className="w-full py-3 rounded-2xl border border-stone-800 text-stone-600 hover:text-stone-300 hover:border-stone-600 text-sm transition-colors"
              >
                Can't find it? Add manually
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ZoekenPage() {
  return <Suspense><ZoekenInner /></Suspense>;
}
