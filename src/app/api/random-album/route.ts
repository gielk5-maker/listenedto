import { NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotify";

export const runtime = "nodejs";

// A pool of well-known search seeds to get varied popular albums
const SEEDS = [
  "year:2020-2024", "year:2015-2019", "year:2010-2014", "year:2000-2009",
  "year:1990-1999", "year:1980-1989", "year:1970-1979",
  "genre:pop", "genre:rock", "genre:hip-hop", "genre:jazz",
  "genre:electronic", "genre:indie", "genre:soul", "genre:r&b",
  "genre:metal", "genre:classical", "genre:folk", "genre:punk",
];

export async function GET() {
  const token = await getSpotifyToken();
  if (!token) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  const seed = SEEDS[Math.floor(Math.random() * SEEDS.length)];
  const offset = Math.floor(Math.random() * 200);

  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(seed)}&type=album&limit=50&offset=${offset}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );

  if (!res.ok) return NextResponse.json({ error: "spotify error" }, { status: 502 });

  const data = await res.json();
  const items: Record<string, unknown>[] = data.albums?.items ?? [];

  const albums = items.filter((a) => {
    const type = a.album_type as string;
    const tracks = (a.total_tracks as number) ?? 0;
    return type !== "single" && tracks >= 4;
  });

  if (albums.length === 0) return NextResponse.json({ error: "no albums" }, { status: 404 });

  const pick = albums[Math.floor(Math.random() * albums.length)];
  const name = pick.name as string;
  const artist = (pick.artists as Array<Record<string, string>>)?.[0]?.name ?? "";
  const image = (pick.images as Array<Record<string, string>>)?.[0]?.url ?? null;
  const url = (pick.external_urls as Record<string, string>)?.spotify ?? null;

  return NextResponse.json({ name, artist, image, url });
}
