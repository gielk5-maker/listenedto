import { NextRequest, NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotify";

export const runtime = "nodejs";

const NIET_LATIJN = /[Ѐ-ӿ一-鿿぀-ゟ゠-ヿ가-힯؀-ۿ]/;

function ok(s: string) { return !!s && !NIET_LATIJN.test(s); }

function dedupAlbums<T extends { name: string; artist: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = `${item.name.toLowerCase().replace(/\s*[\[(].*?[\])]/gi, "").trim()}__${item.artist.split(/feat\.|ft\.|,/i)[0].toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function spotifySearch(query: string, token: string) {
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album,artist&limit=9`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  if (!res.ok) return null;
  const data = await res.json();

  const albums: { name: string; artist: string; image: string | null; mbid: null; url: string | null }[] = ((data.albums?.items ?? []) as Record<string, unknown>[])
    .filter(a => a.album_type !== "single" && ok(a.name as string) && ok((a.artists as { name: string }[])?.[0]?.name ?? ""))
    .map(a => ({
      name: a.name as string,
      artist: (a.artists as { name: string }[])?.[0]?.name ?? "",
      image: ((a.images as { url: string }[])?.[0]?.url ?? null) as string | null,
      mbid: null as null,
      url: ((a.external_urls as Record<string, string>)?.spotify ?? null) as string | null,
    }));

  const artists = ((data.artists?.items ?? []) as Record<string, unknown>[])
    .filter(a => ok(a.name as string) && ((a.followers as { total: number })?.total > 0 || (a.popularity as number) > 0))
    .slice(0, 3)
    .map(a => ({
      name: a.name as string,
      image: (a.images as { url: string }[])?.[0]?.url ?? null,
    }));

  return { albums: dedupAlbums(albums), artists };
}

async function itunesAlbums(query: string) {
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=album&limit=20`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  if (!data) return [];
  return dedupAlbums(
    ((data.results ?? []) as Record<string, unknown>[])
      .filter(a => {
        const name = (a.collectionName as string) ?? "";
        const artist = (a.artistName as string) ?? "";
        if (!name || !artist) return false;
        const nl = name.toLowerCase();
        if (nl.endsWith("- single") || nl.endsWith("- ep")) return false;
        if ((a.collectionType as string) === "Single") return false;
        return ok(name) && ok(artist);
      })
      .map(a => ({
        name: a.collectionName as string,
        artist: a.artistName as string,
        image: ((a.artworkUrl100 as string) ?? "").replace("100x100bb", "600x600bb") || null,
        mbid: null as null,
        url: (a.collectionViewUrl as string) ?? null,
      }))
  );
}

async function itunesArtists(query: string) {
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=musicArtist&limit=5`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  if (!data) return [];
  return ((data.results ?? []) as Record<string, unknown>[])
    .filter(a => ok((a.artistName as string) ?? ""))
    .slice(0, 3)
    .map(a => ({ name: a.artistName as string, image: null as string | null }));
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query) return NextResponse.json({ albums: [], artists: [] });

  const clean = query.replace(/\./g, " ").replace(/\s+/g, " ").trim();

  // Try Spotify first
  try {
    const token = await getSpotifyToken();
    if (token) {
      const spotify = await spotifySearch(query, token);
      if (spotify) {
        const albums = spotify.albums.slice(0, 9);
        const artists = spotify.artists;

        // Supplement albums with iTunes if fewer than 9
        if (albums.length < 9) {
          const extra = await itunesAlbums(clean);
          const seenKeys = new Set(albums.map(a => `${a.name.toLowerCase().replace(/\s*[\[(].*?[\])]/gi, "").trim()}__${a.artist.split(/feat\.|ft\.|,/i)[0].toLowerCase().trim()}`));
          for (const a of extra) {
            const key = `${a.name.toLowerCase().replace(/\s*[\[(].*?[\])]/gi, "").trim()}__${a.artist.split(/feat\.|ft\.|,/i)[0].toLowerCase().trim()}`;
            if (!seenKeys.has(key)) { albums.push(a); seenKeys.add(key); }
            if (albums.length >= 9) break;
          }
        }

        return NextResponse.json({ albums, artists });
      }
    }
  } catch { /* fall through */ }

  // Full iTunes fallback
  const [albums, artists] = await Promise.all([itunesAlbums(clean), itunesArtists(clean)]);
  return NextResponse.json({ albums: albums.slice(0, 9), artists });
}
