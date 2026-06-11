import { NextRequest, NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotify";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const artist = request.nextUrl.searchParams.get("artist");
  if (!artist) return NextResponse.json({ image: null });

  try {
    const token = await getSpotifyToken();
    if (!token) return NextResponse.json({ image: null });

    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(artist)}&type=artist&limit=1`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 86400 } }
    );
    if (!res.ok) return NextResponse.json({ image: null });
    const data = await res.json();
    const item = data.artists?.items?.[0];
    return NextResponse.json({ image: item?.images?.[0]?.url ?? null });
  } catch {
    return NextResponse.json({ image: null });
  }
}
