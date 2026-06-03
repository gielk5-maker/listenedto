import { NextRequest, NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotify";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const artist = request.nextUrl.searchParams.get("artist");
  if (!artist) return NextResponse.json([]);

  try {
    const token = await getSpotifyToken();
    if (!token) return NextResponse.json([]);

    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(artist)}&type=artist&limit=1`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!searchRes.ok) return NextResponse.json([]);
    const searchData = await searchRes.json();
    const artistItem = searchData.artists?.items?.[0];
    if (!artistItem) return NextResponse.json([]);

    const albumsRes = await fetch(
      `https://api.spotify.com/v1/artists/${encodeURIComponent(artistItem.id)}/albums?include_groups=album&limit=10`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!albumsRes.ok) return NextResponse.json([]);
    const albumsData = await albumsRes.json();

    // Dedup by name
    const seen = new Set<string>();
    const albums = (albumsData.items ?? [])
      .filter((a: Record<string, unknown>) => {
        const name = (a.name as string).toLowerCase();
        if (seen.has(name)) return false;
        seen.add(name);
        return true;
      })
      .map((a: Record<string, unknown>) => ({
        name: a.name as string,
        artist: artistItem.name as string,
        image: (a.images as Array<Record<string, string>>)?.[0]?.url ?? null,
        url: (a.external_urls as Record<string, string>)?.spotify ?? null,
        release_date: a.release_date as string,
      }));

    return NextResponse.json({
      artist: {
        name: artistItem.name,
        image: artistItem.images?.[0]?.url ?? null,
        followers: artistItem.followers?.total ?? 0,
      },
      albums,
    });
  } catch {
    return NextResponse.json([]);
  }
}
