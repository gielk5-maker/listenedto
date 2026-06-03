import { NextRequest, NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotify";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const artistsParam = request.nextUrl.searchParams.get("artists");
  if (!artistsParam) return NextResponse.json(null);

  const artists = artistsParam.split(",").slice(0, 5);
  const token = await getSpotifyToken();
  if (!token) return NextResponse.json(null);

  const genreCount: Record<string, number> = {};

  await Promise.all(artists.map(async (artist) => {
    try {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(artist)}&type=artist&limit=1`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );
      if (!res.ok) return;
      const data = await res.json();
      const genres: string[] = data.artists?.items?.[0]?.genres ?? [];
      genres.forEach(g => { genreCount[g] = (genreCount[g] ?? 0) + 1; });
    } catch { /* ignore */ }
  }));

  const top = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  if (!top) return NextResponse.json(null);

  const formatted = top.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return NextResponse.json(formatted);
}
