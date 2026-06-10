"use client";

import { useState, useEffect, Suspense } from "react";
import AppHeader from "@/components/AppHeader";
import AlbumCover from "@/components/AlbumCover";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { searchAlbums, searchArtists, type ArtistResult } from "@/lib/search";
import RandomAlbumButton from "@/components/RandomAlbumButton";
import { createClient } from "@/lib/supabase/client";

type AlbumResult = {
  name: string;
  artist: string;
  image: string | null;
  mbid: string | null;
  url: string | null;
};

type ConcertEvent = {
  id: string;
  artist_name: string;
  venue: string | null;
  city: string;
  country: string;
  concert_date: string;
  _reviewCount?: number;
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
          <input value={name} onChange={e => setName(e.target.value)} onBlur={lookupCover}
            placeholder="e.g. Time Flies... 1994-2001"
            className="w-full bg-stone-800 border border-stone-700/60 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors text-sm" />
        </div>
        <div>
          <label className="block text-xs text-stone-500 mb-1.5">Artist</label>
          <input value={artist} onChange={e => setArtist(e.target.value)} onBlur={lookupCover}
            placeholder="e.g. Oasis"
            className="w-full bg-stone-800 border border-stone-700/60 rounded-xl px-4 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors text-sm" />
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
  const params = useSearchParams();
  const [tab, setTab] = useState<"albums" | "people" | "concerts">(params.get("tab") === "concerts" ? "concerts" : params.get("tab") === "people" ? "people" : "albums");
  const [query, setQuery] = useState(params.get("q") ?? "");

  // Albums state
  const [albumResults, setAlbumResults] = useState<AlbumResult[]>([]);
  const [artists, setArtists] = useState<ArtistResult[]>([]);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [albumSearched, setAlbumSearched] = useState(false);
  const [showManual, setShowManual] = useState(false);

  // People state
  const [peopleResults, setPeopleResults] = useState<{ id: string; username: string }[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleSearched, setPeopleSearched] = useState(false);

  // Concerts state
  const [concertResults, setConcertResults] = useState<ConcertEvent[]>([]);
  const [concertLoading, setConcertLoading] = useState(false);
  const [concertSearched, setConcertSearched] = useState(false);

  async function searchAlbumsTab(q: string) {
    if (!q.trim()) return;
    setAlbumLoading(true);
    setAlbumSearched(true);
    const [albRes, artRes] = await Promise.all([searchAlbums(q.trim()), searchArtists(q.trim())]);
    setAlbumResults(albRes);
    setArtists(artRes);
    setAlbumLoading(false);
  }

  async function searchPeople(q: string) {
    if (!q.trim()) return;
    setPeopleLoading(true);
    setPeopleSearched(true);
    const res = await fetch(`/api/users?q=${encodeURIComponent(q.trim())}`);
    const data = await res.json();
    setPeopleResults(data ?? []);
    setPeopleLoading(false);
  }

  async function searchConcerts(q: string) {
    if (!q.trim()) return;
    setConcertLoading(true);
    setConcertSearched(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("concert_events")
      .select("id, artist_name, venue, city, country, concert_date")
      .ilike("artist_name", `%${q.trim()}%`)
      .order("concert_date", { ascending: false })
      .limit(30);
    setConcertResults(data ?? []);
    setConcertLoading(false);
  }

  useEffect(() => {
    const q = params.get("q");
    if (q) { setQuery(q); searchAlbumsTab(q); }
  }, [params]);

  // Live search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setAlbumResults([]); setArtists([]); setAlbumSearched(false);
      setPeopleResults([]); setPeopleSearched(false);
      setConcertResults([]); setConcertSearched(false);
      return;
    }
    const t = setTimeout(() => {
      if (tab === "albums") searchAlbumsTab(query);
      else if (tab === "people") searchPeople(query);
      else searchConcerts(query);
    }, 350);
    return () => clearTimeout(t);
  }, [query, tab]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
  }

  function goToAlbum(item: AlbumResult) {
    const p = new URLSearchParams({
      name: item.name, artist: item.artist, type: "album",
      ...(item.image ? { image: item.image } : {}),
      ...(item.mbid ? { mbid: item.mbid } : {}),
      ...(item.url ? { url: item.url } : {}),
    });
    window.location.href = `/album?${p.toString()}`;
  }

  const logConcertUrl = (artistName: string) =>
    `/concert/log?artist=${encodeURIComponent(artistName)}`;

  return (
    <div className="min-h-screen text-stone-50">
      <AppHeader right={<Link href="/profile" className="text-stone-400 hover:text-stone-100 text-sm transition-colors">Profile</Link>} />

      <main className="max-w-2xl mx-auto px-5 py-8 space-y-6">
        {/* Centered search area */}
        <div className="flex flex-col items-center gap-3">
          {/* Tabs */}
          <div className="flex w-full max-w-lg">
            <button onClick={() => setTab("albums")}
              className={`flex-1 py-2.5 rounded-l-2xl text-sm font-semibold border-y border-l transition-colors ${tab === "albums" ? "bg-stone-800 text-stone-100 border-stone-700" : "text-stone-500 hover:text-stone-300 bg-stone-900 border-stone-800/60"}`}>
              Albums
            </button>
            <button onClick={() => setTab("people")}
              className={`flex-1 py-2.5 text-sm font-semibold border transition-colors ${tab === "people" ? "bg-stone-800 text-stone-100 border-stone-700" : "text-stone-500 hover:text-stone-300 bg-stone-900 border-stone-800/60"}`}>
              People
            </button>
            <button onClick={() => setTab("concerts")}
              className={`flex-1 py-2.5 rounded-r-2xl text-sm font-semibold border-y border-r transition-colors ${tab === "concerts" ? "bg-stone-800 text-stone-100 border-stone-700" : "text-stone-500 hover:text-stone-300 bg-stone-900 border-stone-800/60"}`}>
              Concerts
            </button>
          </div>
          {/* Search bar */}
          <form onSubmit={handleSubmit} className="w-full max-w-lg flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === "albums" ? "Search an album or artist..." : tab === "people" ? "Search a user..." : "Search a concert by artist..."}
              className="flex-1 bg-stone-900 border border-stone-700/60 rounded-2xl px-5 py-3 text-stone-50 placeholder-stone-600 focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
              autoFocus
            />
            {tab === "albums" && <RandomAlbumButton />}
          </form>
        </div>

        {/* Albums tab */}
        {tab === "albums" && (
          <>
            {albumLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-stone-700 border-t-[var(--accent)] rounded-full animate-spin" />
              </div>
            )}
            {!albumLoading && artists.length > 0 && (
              <div>
                <h2 className="text-xs text-stone-600 uppercase tracking-widest font-semibold mb-3">Artists</h2>
                <div className="flex gap-3">
                  {artists.map((artist, i) => (
                    <Link key={i} href={`/artist?name=${encodeURIComponent(artist.name)}`}
                      className="flex flex-col items-center gap-2 group w-24">
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
            {!albumLoading && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {albumResults.map((item, i) => (
                  <button key={i} onClick={() => goToAlbum(item)}
                    className="bg-stone-900 rounded-2xl overflow-hidden hover:bg-stone-800/80 transition-all text-left border border-stone-800/50 hover:border-stone-700 group hover:scale-[1.01]">
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
            {albumSearched && !albumLoading && (
              <div>
                {showManual ? (
                  <HandmatigForm onDone={() => setShowManual(false)} />
                ) : (
                  <button onClick={() => setShowManual(true)}
                    className="w-full py-3 rounded-2xl border border-stone-800 text-stone-600 hover:text-stone-300 hover:border-stone-600 text-sm transition-colors">
                    Can't find it? Add manually
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* People tab */}
        {tab === "people" && (
          <>
            {peopleLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-stone-700 border-t-[var(--accent)] rounded-full animate-spin" />
              </div>
            )}
            {!peopleLoading && peopleResults.length > 0 && (
              <div className="space-y-2">
                {peopleResults.map((u) => (
                  <Link key={u.id} href={`/user/${u.username}`}
                    className="flex items-center gap-4 bg-stone-900 hover:bg-stone-800/80 rounded-2xl p-3.5 transition-colors border border-stone-800/40 hover:border-stone-700">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] flex items-center justify-center text-sm font-bold text-[var(--accent-text)] flex-shrink-0">
                      {u.username[0]?.toUpperCase()}
                    </div>
                    <p className="font-semibold text-sm text-stone-100">{u.username}</p>
                  </Link>
                ))}
              </div>
            )}
            {peopleSearched && !peopleLoading && peopleResults.length === 0 && (
              <div className="text-center py-12">
                <p className="text-stone-500 text-sm">No users found for "{query}".</p>
              </div>
            )}
            {!peopleSearched && (
              <div className="text-center py-16 text-stone-600 text-sm">
                Search for a user by username.
              </div>
            )}
          </>
        )}

        {/* Concerts tab */}
        {tab === "concerts" && (
          <>
            {concertLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-stone-700 border-t-[var(--accent)] rounded-full animate-spin" />
              </div>
            )}
            {!concertLoading && concertResults.length > 0 && (
              <div className="space-y-2">
                {concertResults.map((c) => (
                  <Link key={c.id} href={`/concert/${c.id}`}
                    className="flex items-center gap-4 bg-stone-900 hover:bg-stone-800/80 rounded-2xl p-3.5 transition-colors border border-stone-800/40 hover:border-stone-700">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] flex items-center justify-center text-lg flex-shrink-0">
                      🎤
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate text-stone-100">{c.artist_name}</p>
                      <p className="text-stone-500 text-xs truncate">{c.venue ? `${c.venue} · ` : ""}{c.city}, {c.country}</p>
                    </div>
                    <p className="text-stone-600 text-xs flex-shrink-0">
                      {new Date(c.concert_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </Link>
                ))}
              </div>
            )}
            {concertSearched && !concertLoading && concertResults.length === 0 && (
              <div className="text-center py-12 space-y-4">
                <p className="text-stone-500 text-sm">No concerts found for "{query}".</p>
                <Link href={logConcertUrl(query)}
                  className="inline-block bg-[var(--accent)] hover:opacity-90 text-[var(--accent-text)] font-bold rounded-2xl px-5 py-2.5 text-sm transition-opacity">
                  + Log this concert
                </Link>
              </div>
            )}
            {!concertSearched && (
              <div className="text-center py-16 text-stone-600 text-sm">
                Search for a concert by artist name.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function ZoekenPage() {
  return <Suspense><ZoekenInner /></Suspense>;
}
