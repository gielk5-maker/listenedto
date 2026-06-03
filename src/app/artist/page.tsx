"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

type Album = {
  name: string;
  artist: string;
  image: string | null;
  url: string | null;
  release_date: string;
  avg?: number;
  count?: number;
};

function SmallStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 items-center">
      {[1,2,3,4,5].map(star => {
        const full = rating >= star;
        const half = !full && rating >= star - 0.5;
        return (
          <span key={star} className="relative inline-block text-xs leading-none">
            <span className="text-stone-700">★</span>
            {(full || half) && (
              <span className="absolute inset-0 overflow-hidden text-[var(--accent)]" style={{ width: full ? "100%" : "50%" }}>★</span>
            )}
          </span>
        );
      })}
      <span className="text-stone-500 text-xs ml-1">{rating}</span>
    </div>
  );
}

function ArtistPageInner() {
  const params = useSearchParams();
  const artistName = params.get("name") ?? "";
  const supabase = createClient();

  const [artistInfo, setArtistInfo] = useState<{ name: string; image: string | null } | null>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!artistName) return;
    async function load() {
      setLoading(true);

      // Fetch Spotify albums + ratings in parallel
      const [spotifyRes, ratingsRes] = await Promise.all([
        fetch(`/api/artist-albums?artist=${encodeURIComponent(artistName)}`),
        supabase.from("ratings").select("album_name, rating").eq("artist_name", artistName).not("rating", "is", null),
      ]);

      const spotifyData = await spotifyRes.json();
      if (!spotifyData.albums) { setLoading(false); return; }

      setArtistInfo(spotifyData.artist);

      // Normalize album name: strip parenthetical suffixes for matching
      function normalize(name: string) {
        return name.toLowerCase()
          .replace(/\s*[\[(][^\])]*(explicit|deluxe|remaster|edition|version|bonus|anniversary|expanded)[^\])]*[\])]/gi, "")
          .replace(/\s*[\[(][^\])]*[\])]/gi, "")
          .trim();
      }

      // Build rating map from DB + calculate overall avg
      const ratingMap: Record<string, { total: number; count: number }> = {};
      const allRatings = ratingsRes.data ?? [];
      allRatings.forEach(r => {
        // Store under both exact and normalized key
        const exact = r.album_name.toLowerCase();
        const norm = normalize(r.album_name);
        for (const key of [exact, norm]) {
          if (!ratingMap[key]) ratingMap[key] = { total: 0, count: 0 };
          ratingMap[key].total += r.rating;
          ratingMap[key].count++;
        }
      });

      if (allRatings.length > 0) {
        const total = allRatings.reduce((s, r) => s + r.rating, 0);
        setAvgRating(Math.round((total / allRatings.length) * 10) / 10);
      }

      // Merge
      const merged: Album[] = spotifyData.albums.map((a: Album) => {
        const exact = a.name.toLowerCase();
        const norm = normalize(a.name);
        const stats = ratingMap[exact] ?? ratingMap[norm];
        return {
          ...a,
          avg: stats ? Math.round((stats.total / stats.count) * 10) / 10 : undefined,
          count: stats?.count,
        };
      });

      // Sort: rated first (by avg desc), then unrated (by release date desc)
      merged.sort((a, b) => {
        if (a.avg !== undefined && b.avg !== undefined) return b.avg - a.avg;
        if (a.avg !== undefined) return -1;
        if (b.avg !== undefined) return 1;
        return (b.release_date ?? "").localeCompare(a.release_date ?? "");
      });

      setAlbums(merged);
      setLoading(false);
    }
    load();
  }, [artistName]);

  if (!artistName) return <div className="min-h-screen flex items-center justify-center text-stone-600">No artist specified.</div>;

  return (
    <div className="min-h-screen text-stone-50">
      <header className="border-b border-stone-800/60 px-5 py-3 flex items-center gap-3">
        <Link href="/feed" className="flex items-center gap-2 text-base font-bold">
          <Logo />
          ListenedTo
        </Link>
        <Link href="/search" className="text-stone-500 hover:text-stone-200 text-sm transition-colors ml-auto">← Search</Link>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8">
        {/* Artist header */}
        {artistInfo && (
          <div className="flex items-center gap-5 mb-8">
            {artistInfo.image && (
              <img src={artistInfo.image} alt={artistInfo.name} className="w-20 h-20 rounded-full object-cover shadow-xl shadow-black/40 flex-shrink-0" />
            )}
            <div>
              <h1 className="text-2xl font-bold">{artistInfo.name}</h1>
              {avgRating !== null
                ? <p className="text-[var(--accent)] text-sm font-medium mt-1">★ {avgRating} avg. rating</p>
                : <p className="text-stone-600 text-sm mt-1">No ratings yet</p>
              }
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-16 bg-stone-900 rounded-2xl animate-pulse border border-stone-800/40" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {albums.map((album, i) => (
              <Link
                key={i}
                href={`/album?name=${encodeURIComponent(album.name)}&artist=${encodeURIComponent(album.artist)}${album.image ? `&image=${encodeURIComponent(album.image)}` : ""}${album.url ? `&url=${encodeURIComponent(album.url)}` : ""}`}
                className="flex items-center gap-4 bg-stone-900 hover:bg-stone-800/80 rounded-2xl p-3 transition-colors border border-stone-800/40 hover:border-stone-700"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-800 flex-shrink-0">
                  {album.image
                    ? <img src={album.image} alt={album.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-stone-600">💿</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{album.name}</p>
                  <p className="text-stone-600 text-xs">{album.release_date?.slice(0, 4)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {album.avg !== undefined ? (
                    <>
                      <SmallStars rating={album.avg} />
                      <p className="text-stone-600 text-[10px] mt-0.5">{album.count} {album.count === 1 ? "rating" : "ratings"}</p>
                    </>
                  ) : (
                    <p className="text-stone-700 text-xs">No ratings yet</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ArtistPage() {
  return <Suspense><ArtistPageInner /></Suspense>;
}
