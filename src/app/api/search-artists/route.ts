import { NextRequest, NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotify";

export const runtime = "nodejs";

const nietLatijn = /[Ѐ-ӿ一-鿿぀-ゟ゠-ヿ가-힯؀-ۿ]/;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json([]);

  try {
    const token = await getSpotifyToken();
    if (!token) return NextResponse.json([]);

    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=10`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    const artists = ((data.artists?.items ?? []) as Record<string, unknown>[])
      .filter(a => !!a.name && !nietLatijn.test(a.name as string))
      .slice(0, 3)
      .map(a => ({
        name: a.name as string,
        image: (a.images as Array<{ url: string }>)?.[0]?.url ?? null,
      }));

    return NextResponse.json(artists);
  } catch {
    return NextResponse.json([]);
  }
}
