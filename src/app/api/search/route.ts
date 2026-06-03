import { NextRequest, NextResponse } from "next/server";
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

function mapSpotifyAlbums(items: Record<string, unknown>[]) {
  return dedup(items
    .filter(a => {
      const naam = a.name as string;
      const artiest = (a.artists as Array<Record<string, string>>)?.[0]?.name ?? "";
      return !nietLatijn.test(naam) && !nietLatijn.test(artiest);
    })
    .map(a => ({
      name: a.name as string,
      artist: (a.artists as Array<Record<string, string>>)?.[0]?.name ?? "",
      image: (a.images as Array<Record<string, string>>)?.[0]?.url ?? null,
      mbid: null,
      url: (a.external_urls as Record<string, string>)?.spotify ?? null,
    })));
}

async function itunesSearch(query: string) {
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=album&limit=10`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  if (!data) return [];
  return dedup((data.results ?? [])
    .filter((a: Record<string, unknown>) => {
      const name = a.collectionName as string ?? "";
      const artist = a.artistName as string ?? "";
      return name && artist && !nietLatijn.test(name) && !nietLatijn.test(artist);
    })
    .map((a: Record<string, unknown>) => ({
      name: a.collectionName as string,
      artist: a.artistName as string,
      image: ((a.artworkUrl100 as string) ?? "").replace("100x100bb", "600x600bb") || null,
      mbid: null,
      url: a.collectionViewUrl as string ?? null,
    })));
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  const type = request.nextUrl.searchParams.get("type") ?? "album";
  // Client-side Spotify result passed in
  const clientResults = request.nextUrl.searchParams.get("_client");

  if (!query) return NextResponse.json([]);

  // If client already fetched Spotify results, use those
  if (clientResults) {
    try {
      const parsed = JSON.parse(decodeURIComponent(clientResults));
      if (Array.isArray(parsed) && parsed.length > 0) {
        return NextResponse.json(mapSpotifyAlbums(parsed));
      }
    } catch { /* ignore */ }
  }

  // Try Spotify from server
  try {
    const token = await getSpotifyToken();
    if (token) {
      const spotifyType = type === "track" ? "track" : "album";
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${spotifyType}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data) {
          const items = type === "track" ? (data.tracks?.items ?? []) : (data.albums?.items ?? []);
          const mapped = mapSpotifyAlbums(items);
          if (mapped.length > 0) return NextResponse.json(mapped);
        }
      }
    }
  } catch { /* fall through to iTunes */ }

  // Fallback: iTunes
  const itunes = await itunesSearch(query);
  return NextResponse.json(itunes);
}
