import { NextRequest, NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotify";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { artists }: { artists: string[] } = await request.json();
  if (!artists?.length) return NextResponse.json({});

  const token = await getSpotifyToken();
  if (!token) return NextResponse.json({});

  const results = await Promise.all(
    artists.map(async (artist) => {
      try {
        const res = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(artist)}&type=artist&limit=1`,
          { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 86400 } }
        );
        if (!res.ok) return [artist, null] as const;
        const data = await res.json();
        const image = data.artists?.items?.[0]?.images?.[0]?.url ?? null;
        return [artist, image] as const;
      } catch {
        return [artist, null] as const;
      }
    })
  );

  return NextResponse.json(Object.fromEntries(results));
}
