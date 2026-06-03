import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

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

// iTunes fallback — filters out singles
async function itunesSearch(query: string) {
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=album&limit=20`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  if (!data) return [];
  return dedup((data.results ?? [])
    .filter((a: Record<string, unknown>) => {
      const name = a.collectionName as string ?? "";
      const artist = a.artistName as string ?? "";
      const type = a.collectionType as string ?? "";
      const tracks = a.trackCount as number ?? 0;
      // Filter out singles and EPs (< 4 tracks)
      if (type === "Single" || tracks < 4) return false;
      return name && artist && !nietLatijn.test(name) && !nietLatijn.test(artist);
    })
    .map((a: Record<string, unknown>) => ({
      name: a.collectionName as string,
      artist: a.artistName as string,
      image: ((a.artworkUrl100 as string) ?? "").replace("100x100bb", "600x600bb") || null,
      mbid: null,
      url: a.collectionViewUrl as string ?? null,
    })));
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json([]);
  const results = await itunesSearch(query);
  return NextResponse.json(results);
}
