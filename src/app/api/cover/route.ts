import { NextRequest, NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotify";

export async function GET(request: NextRequest) {
  const album = request.nextUrl.searchParams.get("album");
  const artist = request.nextUrl.searchParams.get("artist");

  if (!album || !artist) return NextResponse.json({ url: null });

  // Try Spotify first — most reliable match
  try {
    const token = await getSpotifyToken();
    if (token) {
      const q = `album:${album} artist:${artist}`;
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=album&limit=5`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        const items = data.albums?.items ?? [];
        const match = items.find((a: Record<string, unknown>) =>
          (a.name as string).toLowerCase().includes(album.toLowerCase())
        ) ?? items[0];
        const imgUrl = (match?.images as Array<{ url: string }>)?.[0]?.url;
        if (imgUrl) return NextResponse.json({ url: imgUrl });
      }
    }
  } catch { /* fall through */ }

  // Fallback: MusicBrainz / CoverArtArchive
  try {
    const q = encodeURIComponent(`release:"${album}" artist:"${artist}"`);
    const mbRes = await fetch(
      `https://musicbrainz.org/ws/2/release/?query=${q}&limit=10&fmt=json`,
      { headers: { "User-Agent": "ListenedTo/1.0 (listenedto.app)" } }
    );
    const mbData = await mbRes.json();
    const releases: { id: string }[] = mbData.releases ?? [];

    for (const release of releases) {
      try {
        const coverRes = await fetch(
          `https://coverartarchive.org/release/${release.id}/front`,
          { redirect: "follow" }
        );
        if (coverRes.ok) return NextResponse.json({ url: coverRes.url });
      } catch { continue; }
    }
  } catch { /* ignore */ }

  return NextResponse.json({ url: null });
}
