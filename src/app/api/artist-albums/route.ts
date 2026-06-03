import { NextRequest, NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotify";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const artist = request.nextUrl.searchParams.get("artist");
  if (!artist) return NextResponse.json([]);

  try {
    const token = await getSpotifyToken();
    if (!token) return NextResponse.json([]);

    // Search for the artist
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(artist)}&type=artist&limit=1`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!searchRes.ok) return NextResponse.json([]);
    const searchData = await searchRes.json();
    const artistItem = searchData.artists?.items?.[0];
    if (!artistItem) return NextResponse.json([]);

    // Fetch all albums via pagination (limit=10 per request)
    const allItems: Record<string, unknown>[] = [];
    let offset = 0;
    let total = 999;

    while (allItems.length < total && offset < 100) {
      const albumsRes = await fetch(
        `https://api.spotify.com/v1/artists/${encodeURIComponent(artistItem.id)}/albums?include_groups=album&limit=10&offset=${offset}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );
      if (!albumsRes.ok) break;
      const albumsData = await albumsRes.json();
      total = albumsData.total ?? 0;
      const items = albumsData.items ?? [];
      if (items.length === 0) break;
      allItems.push(...items);
      offset += items.length;
    }

    // Dedup by name
    const seen = new Set<string>();
    const albums = allItems
      .filter((a) => {
        const name = (a.name as string).toLowerCase();
        if (seen.has(name)) return false;
        seen.add(name);
        return true;
      })
      .map((a) => ({
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
      },
      albums,
    });
  } catch {
    return NextResponse.json([]);
  }
}
