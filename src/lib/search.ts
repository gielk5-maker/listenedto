const nietLatijn = /[Ѐ-ӿ一-鿿぀-ゟ゠-ヿ가-힯؀-ۿ]/;

export type SearchResult = {
  name: string;
  artist: string;
  image: string | null;
  mbid: string | null;
  url: string | null;
};

export type ArtistResult = {
  name: string;
  image: string | null;
};

export async function searchArtists(query: string): Promise<ArtistResult[]> {
  try {
    const tokenRes = await fetch("/api/spotify-token");
    const { token } = await tokenRes.json();
    if (!token) return [];
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.artists?.items ?? [])
      .filter((a: Record<string, unknown>) => {
        if (nietLatijn.test(a.name as string)) return false;
        const followers = (a.followers as Record<string, number>)?.total ?? 0;
        const popularity = (a.popularity as number) ?? 0;
        // Filter out artists with no followers and no popularity — these have no releases
        return followers > 0 || popularity > 0;
      })
      .slice(0, 3)
      .map((a: Record<string, unknown>) => ({
        name: a.name as string,
        image: (a.images as Array<Record<string, string>>)?.[0]?.url ?? null,
      }));
  } catch {
    return [];
  }
}

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
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const albums = data.albums?.items ?? [];

    const results = albums
      .filter((a: Record<string, unknown>) => {
        if (a.album_type === "single") return false;
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

    return dedup(results);
  } catch {
    return null;
  }
}

export async function searchAlbums(query: string): Promise<SearchResult[]> {
  const cleanQuery = query.replace(/\./g, " ").replace(/\s+/g, " ").trim();

  // Run Spotify (browser) and iTunes (server) in parallel
  const [spotify, itunesData] = await Promise.all([
    spotifySearch(query),
    fetch(`/api/search?q=${encodeURIComponent(cleanQuery)}&source=itunes`)
      .then(r => r.json()).catch(() => []),
  ]);

  const spotifyResults: SearchResult[] = spotify ?? [];
  const itunesResults: SearchResult[] = Array.isArray(itunesData) ? itunesData : [];

  // Merge: Spotify first, then iTunes items not already in Spotify
  const seen = new Set(spotifyResults.map(s =>
    `${s.name.toLowerCase().replace(/\s*[\[(].*?[\])]/gi, "").trim()}__${s.artist.split(/feat\.|ft\.|,/i)[0].toLowerCase().trim()}`
  ));
  const extras = itunesResults.filter(item => {
    const key = `${item.name.toLowerCase().replace(/\s*[\[(].*?[\])]/gi, "").trim()}__${item.artist.split(/feat\.|ft\.|,/i)[0].toLowerCase().trim()}`;
    return !seen.has(key);
  });

  return [...spotifyResults, ...extras];
}
