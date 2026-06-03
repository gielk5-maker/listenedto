import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getSpotifyToken } from "@/lib/spotify";

export const runtime = "nodejs";

const nietLatijn = /[Ѐ-ӿ一-鿿぀-ゟ゠-ヿ가-힯؀-ۿ]/;

function dedup<T extends { name: string; artist: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const naam = item.name.toLowerCase().replace(/\s*[\[(].*?[\])]/gi, "").trim();
    const artiest = item.artist.split(/feat\.|ft\.|,|\/|;|—/i)[0].toLowerCase().trim();
    const key = `${naam}__${artiest}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function spotifySearch(query: string, type: string) {
  const token = await getSpotifyToken();
  if (!token) return null;

  const spotifyType = type === "track" ? "track" : "album";
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${spotifyType}&limit=10`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data) return null;

  if (type === "track") {
    const tracks = data.tracks?.items ?? [];
    return dedup(tracks
      .filter((t: Record<string, unknown>) => {
        const artiest = (t.artists as Array<Record<string, string>>)?.[0]?.name ?? "";
        return !nietLatijn.test(t.name as string) && !nietLatijn.test(artiest);
      })
      .map((t: Record<string, unknown>) => ({
        name: t.name as string,
        artist: (t.artists as Array<Record<string, string>>)?.[0]?.name ?? "",
        image: (t.album as Record<string, unknown>)?.images
          ? ((t.album as Record<string, unknown>).images as Array<Record<string, string>>)?.[0]?.url ?? null : null,
        mbid: null,
        url: (t.external_urls as Record<string, string>)?.spotify ?? null,
      })));
  } else {
    const albums = data.albums?.items ?? [];
    return dedup(albums
      .filter((a: Record<string, unknown>) => {
        const naam = a.name as string;
        const artiest = (a.artists as Array<Record<string, string>>)?.[0]?.name ?? "";
        return !nietLatijn.test(naam) && !nietLatijn.test(artiest);
      })
      .map((a: Record<string, unknown>) => ({
        name: a.name as string,
        artist: (a.artists as Array<Record<string, string>>)?.[0]?.name ?? "",
        image: (a.images as Array<Record<string, string>>)?.[0]?.url ?? null,
        mbid: null,
        url: (a.external_urls as Record<string, string>)?.spotify ?? null,
      })));
  }
}

async function musicBrainzSearch(query: string) {
  // Search both by artist name and release title
  const lucene = `(artist:"${query}" OR release:"${query}")`;
  const res = await fetch(
    `https://musicbrainz.org/ws/2/release-group/?query=${encodeURIComponent(lucene)}&limit=15&fmt=json`,
    { headers: { "User-Agent": "ListenedTo/1.0 (listenedto.app)" }, cache: "no-store" }
  );
  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  if (!data) return [];

  const groups = data["release-groups"] ?? [];
  const results = [];
  for (const r of groups) {
    if ((r.score ?? 0) < 50) continue;
    const artist = r["artist-credit"]?.[0]?.artist?.name ?? r["artist-credit"]?.[0]?.name ?? "";
    if (!artist || nietLatijn.test(r.title) || nietLatijn.test(artist)) continue;
    results.push({ name: r.title, artist, image: null, mbid: r.id, url: null });
    if (results.length >= 8) break;
  }
  return dedup(results);
}

async function fetchSearch(query: string, type: string) {
  // Try Spotify first
  const spotifyResults = await spotifySearch(query, type);
  if (spotifyResults && spotifyResults.length > 0) return spotifyResults;

  // Fallback to MusicBrainz
  if (type === "album") {
    return await musicBrainzSearch(query);
  }
  return [];
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  const type = request.nextUrl.searchParams.get("type") ?? "album";

  if (!query) return NextResponse.json([]);

  const cachedSearch = unstable_cache(
    () => fetchSearch(query, type),
    [`search-${type}-${query.toLowerCase().trim()}`],
    { revalidate: 600 }
  );

  try {
    const results = await cachedSearch();
    return NextResponse.json(results ?? []);
  } catch {
    return NextResponse.json([]);
  }
}
