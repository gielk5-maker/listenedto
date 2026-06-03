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

// iTunes fallback — filters out singles
async function itunesSearch(query: string) {
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=album&limit=20`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  if (!data) return [];
  return dedup((data.results ?? [])
    .filter((a: Record<string, unknown>) => {
      const name = a.collectionName as string ?? "";
      const artist = a.artistName as string ?? "";
      const type = a.collectionType as string ?? "";
      const tracks = a.trackCount as number ?? 0;
      // Filter out singles and EPs (< 4 tracks)
      if (type === "Single" || tracks < 4) return false;
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

function mapSpotifyAlbums(items: Record<string, unknown>[]) {
  return dedup(items
    .filter(a => {
      const naam = a.name as string;
      const artiest = (a.artists as Array<Record<string, string>>)?.[0]?.name ?? "";
      const albumType = a.album_type as string ?? "";
      if (albumType === "single") return false;
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

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json([]);

  // Try Spotify server-side first
  try {
    const token = await getSpotifyToken();
    if (token) {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=10`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data) {
          const mapped = mapSpotifyAlbums(data.albums?.items ?? []);
          if (mapped.length > 0) return NextResponse.json(mapped);
        }
      }
    }
  } catch { /* fall through */ }

  // Fallback: iTunes
  const cleanQuery = query.replace(/\./g, " ").trim();
  return NextResponse.json(await itunesSearch(cleanQuery));
}
