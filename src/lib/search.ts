const nietLatijn = /[Ѐ-ӿ一-鿿぀-ゟ゠-ヿ가-힯؀-ۿ]/;

export type SearchResult = {
  name: string;
  artist: string;
  image: string | null;
  mbid: string | null;
  url: string | null;
};

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

async function spotifySearch(query: string): Promise<SearchResult[] | null> {
  try {
    const tokenRes = await fetch("/api/spotify-token");
    if (!tokenRes.ok) return null;
    const { token } = await tokenRes.json();
    if (!token) return null;

    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const albums = data.albums?.items ?? [];

    const results = albums
      .filter((a: Record<string, unknown>) => {
        const naam = a.name as string;
        const artiest = (a.artists as Array<Record<string, string>>)?.[0]?.name ?? "";
        const albumType = a.album_type as string ?? "";
        // Filter out singles and EPs
        if (albumType === "single") return false;
        return !nietLatijn.test(naam) && !nietLatijn.test(artiest);
      })
      .map((a: Record<string, unknown>) => ({
        name: a.name as string,
        artist: (a.artists as Array<Record<string, string>>)?.[0]?.name ?? "",
        image: (a.images as Array<Record<string, string>>)?.[0]?.url ?? null,
        mbid: null,
        url: (a.external_urls as Record<string, string>)?.spotify ?? null,
      }));

    return dedup(results);
  } catch {
    return null;
  }
}

export async function searchAlbums(query: string): Promise<SearchResult[]> {
  // Try Spotify from browser (each user's own IP, no server rate limit)
  const spotify = await spotifySearch(query);
  if (spotify && spotify.length > 0) return spotify;

  // Fallback: iTunes via server
  // Clean query for better iTunes matching (remove dots, special chars)
  const cleanQuery = query.replace(/\./g, " ").replace(/\s+/g, " ").trim();
  const searchQuery = cleanQuery !== query ? cleanQuery : query;

  const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}
