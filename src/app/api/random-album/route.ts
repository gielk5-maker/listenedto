import { NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotify";

export const runtime = "nodejs";

// year: filter works reliably for album search; genre: does NOT work for albums
const SEEDS = [
  "year:2024", "year:2023", "year:2022", "year:2021", "year:2020",
  "year:2019", "year:2018", "year:2017", "year:2016", "year:2015",
  "year:2010-2014", "year:2005-2009", "year:2000-2004",
  "year:1995-1999", "year:1990-1994", "year:1985-1989", "year:1980-1984",
  "year:1970-1979", "year:1960-1969",
  "album", "music", "love", "life", "night", "soul", "world",
];

export async function GET() {
  const token = await getSpotifyToken();
  if (!token) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  function filterAlbums(items: Record<string, unknown>[]) {
    return items.filter((a) => {
      const type = a.album_type as string;
      const tracks = (a.total_tracks as number) ?? 0;
      return type !== "single" && tracks >= 4;
    });
  }

  let albums: Record<string, unknown>[] = [];

  // Try up to 3 different seeds until we get results
  for (let attempt = 0; attempt < 3; attempt++) {
    const seed = SEEDS[Math.floor(Math.random() * SEEDS.length)];
    const offset = Math.floor(Math.random() * 5) * 10; // 0, 10, 20, 30, or 40

    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(seed)}&type=album&limit=50&offset=${offset}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!res.ok) continue;

    const data = await res.json();
    const items: Record<string, unknown>[] = data.albums?.items ?? [];
    albums = filterAlbums(items);
    if (albums.length > 0) break;
  }

  if (albums.length === 0) return NextResponse.json({ error: "no albums" }, { status: 404 });

  const pick = albums[Math.floor(Math.random() * albums.length)];
  const name = pick.name as string;
  const artist = (pick.artists as Array<Record<string, string>>)?.[0]?.name ?? "";
  const image = (pick.images as Array<Record<string, string>>)?.[0]?.url ?? null;
  const url = (pick.external_urls as Record<string, string>)?.spotify ?? null;

  return NextResponse.json({ name, artist, image, url });
}
