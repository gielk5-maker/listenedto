import { NextRequest, NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotify";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const spotifyUrl = request.nextUrl.searchParams.get("url");
  const artist = request.nextUrl.searchParams.get("artist");
  const album = request.nextUrl.searchParams.get("album");

  const token = await getSpotifyToken();
  if (!token) return NextResponse.json([]);

  try {
    let artistId: string | null = null;

    // Try to get artist ID from Spotify album URL
    if (spotifyUrl) {
      const albumId = spotifyUrl.match(/album\/([a-zA-Z0-9]+)/)?.[1];
      if (albumId) {
        const res = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
          headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          artistId = data.artists?.[0]?.id ?? null;
        }
      }
    }

    // Fallback: search by album + artist name
    if (!artistId && artist) {
      const q = album ? `album:${album} artist:${artist}` : `artist:${artist}`;
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=album&limit=1`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        artistId = data.albums?.items?.[0]?.artists?.[0]?.id ?? null;
      }
    }

    if (!artistId) return NextResponse.json([]);

    const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
    });
    if (!res.ok) return NextResponse.json([]);
    const data = await res.json();

    const genres: string[] = (data.genres ?? []).slice(0, 5).map((g: string) =>
      g.split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    );

    return NextResponse.json(genres);
  } catch {
    return NextResponse.json([]);
  }
}
