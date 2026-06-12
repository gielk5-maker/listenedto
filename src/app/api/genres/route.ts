import { NextRequest, NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotify";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const spotifyUrl = request.nextUrl.searchParams.get("url");
  const artistName = request.nextUrl.searchParams.get("artist");
  const albumName = request.nextUrl.searchParams.get("album");

  try {
    const token = await getSpotifyToken();
    if (!token) return NextResponse.json([]);

    let artistId: string | null = null;

    // Extract album ID from Spotify URL if available
    if (spotifyUrl) {
      const match = spotifyUrl.match(/album\/([a-zA-Z0-9]+)/);
      if (match) {
        const albumId = match[1];
        const albumRes = await fetch(
          `https://api.spotify.com/v1/albums/${albumId}`,
          { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
        );
        if (albumRes.ok) {
          const albumData = await albumRes.json();
          // Albums sometimes have genres directly
          if (albumData.genres?.length > 0) {
            return NextResponse.json(albumData.genres.slice(0, 3));
          }
          // Otherwise use the first artist
          artistId = albumData.artists?.[0]?.id ?? null;
        }
      }
    }

    // If no artistId yet, search for artist by name
    if (!artistId && artistName) {
      const searchRes = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        artistId = searchData.artists?.items?.[0]?.id ?? null;
      }
    }

    // Get genres from artist
    if (artistId) {
      const artistRes = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );
      if (artistRes.ok) {
        const artistData = await artistRes.json();
        return NextResponse.json((artistData.genres ?? []).slice(0, 3));
      }
    }

    return NextResponse.json([]);
  } catch {
    return NextResponse.json([]);
  }
}
