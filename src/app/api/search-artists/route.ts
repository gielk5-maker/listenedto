import { NextRequest, NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotify";

export const runtime = "nodejs";

const nietLatijn = /[Ѐ-ӿ一-鿿぀-ゟ゠-ヿ가-힯؀-ۿ]/;

async function spotifyArtists(query: string, token: string) {
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=10`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return (data.artists?.items ?? [])
    .filter((a: Record<string, unknown>) => {
      if (nietLatijn.test(a.name as string)) return false;
      const followers = (a.followers as Record<string, number>)?.total ?? 0;
      const popularity = (a.popularity as number) ?? 0;
      return followers > 0 || popularity > 0;
    })
    .slice(0, 3)
    .map((a: Record<string, unknown>) => ({
      name: a.name as string,
      image: (a.images as Array<Record<string, string>>)?.[0]?.url ?? null,
    }));
}

async function itunesArtists(query: string) {
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=musicArtist&limit=5`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  if (!data) return [];
  return (data.results ?? [])
    .filter((a: Record<string, unknown>) => {
      const name = a.artistName as string ?? "";
      return name && !nietLatijn.test(name);
    })
    .slice(0, 3)
    .map((a: Record<string, unknown>) => ({
      name: a.artistName as string,
      image: null as string | null,
    }));
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json([]);

  try {
    const token = await getSpotifyToken();
    if (token) {
      const results = await spotifyArtists(query, token);
      if (results && results.length > 0) return NextResponse.json(results);
    }
  } catch { /* fall through */ }

  // Fallback to iTunes
  return NextResponse.json(await itunesArtists(query));
}
