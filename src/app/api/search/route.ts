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
  if (!query) return NextResponse.json([]);

  try {
    const spotify = await spotifySearch(query, type);
    if (spotify && spotify.length > 0) return NextResponse.json(spotify);
    const itunes = await itunesSearch(query);
    return NextResponse.json(itunes);
  } catch {
    return NextResponse.json([]);
  }
}
