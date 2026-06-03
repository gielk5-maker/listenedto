import { NextRequest, NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotify";

const nietLatijn = /[Ѐ-ӿ一-鿿぀-ゟ゠-ヿ가-힯؀-ۿ]/;

function dedup<T extends { name: string; artist: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const naam = item.name.toLowerCase().replace(/\s*[\[(].*?[\])]/gi, "").trim();
    const artiest = item.artist.split(/feat\.|ft\.|,|\/|;|—/i)[0].toLowerCase().trim();
    const key = `${naam}__${artiest}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  const type = request.nextUrl.searchParams.get("type") ?? "album";
  const debug = request.nextUrl.searchParams.get("debug") === "1";

  if (!query) {
    return NextResponse.json({ error: "Geen zoekopdracht" }, { status: 400 });
  }

  const token = await getSpotifyToken();
  const spotifyType = type === "track" ? "track" : "album";

  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${spotifyType}&limit=10`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );

  const rawText = await res.text();

  if (debug) {
    return NextResponse.json({ status: res.status, raw: rawText.slice(0, 1000) });
  }

  if (!res.ok) {
    return NextResponse.json([], { status: 200 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch {
    return NextResponse.json([], { status: 200 });
  }

  if (type === "track") {
    const tracks = data?.tracks?.items ?? [];
    const mapped = tracks
      .filter((t: Record<string, unknown>) => {
        const artiest = (t.artists as Array<Record<string, string>>)?.[0]?.name ?? "";
        return !nietLatijn.test(t.name as string) && !nietLatijn.test(artiest);
      })
      .map((t: Record<string, unknown>) => ({
        name: t.name as string,
        artist: (t.artists as Array<Record<string, string>>)?.[0]?.name ?? "",
        image: (t.album as Record<string, unknown>)?.images
          ? ((t.album as Record<string, unknown>).images as Array<Record<string, string>>)?.[0]?.url ?? null
          : null,
        mbid: null,
        url: (t.external_urls as Record<string, string>)?.spotify ?? null,
      }));
    return NextResponse.json(dedup(mapped));
  } else {
    const albums = data?.albums?.items ?? [];
    const mapped = albums
      .filter((a: Record<string, unknown>) => {
        const naam = a.name as string;
        const artiest = (a.artists as Array<Record<string, string>>)?.[0]?.name ?? "";
        return !nietLatijn.test(naam) && !nietLatijn.test(artiest);
      })
      .map((a: Record<string, unknown>) => ({
        name: a.name as string,
        artist: (a.artists as Array<Record<string, string>>)?.[0]?.name ?? "",
        image: (a.images as Array<Record<string, string>>)?.[0]?.url ?? null,
        mbid: null,
        url: (a.external_urls as Record<string, string>)?.spotify ?? null,
      }));
    return NextResponse.json(dedup(mapped));
  }
}
