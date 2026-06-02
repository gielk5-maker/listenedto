import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const album = request.nextUrl.searchParams.get("album");
  const artist = request.nextUrl.searchParams.get("artist");

  if (!album || !artist) return NextResponse.json({ url: null });

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
        if (coverRes.ok) {
          return NextResponse.json({ url: coverRes.url });
        }
      } catch { continue; }
    }

    return NextResponse.json({ url: null });
  } catch {
    return NextResponse.json({ url: null });
  }
}
