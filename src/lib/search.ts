const NIET_LATIJN = /[Ѐ-ӿ一-鿿぀-ゟ゠-ヿ가-힯؀-ۿ]/;

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

function dedupAlbums(items: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = `${item.name.toLowerCase().replace(/\s*[\[(].*?[\])]/gi, "").trim()}__${item.artist.split(/feat\.|ft\.|,/i)[0].toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function okArtist(name: string) { return name && !NIET_LATIJN.test(name); }

export async function searchAlbumsAndArtists(query: string): Promise<{ albums: SearchResult[]; artists: ArtistResult[] }> {
  const clean = query.replace(/\./g, " ").replace(/\s+/g, " ").trim();

  // Try Spotify (client-side, each user's own IP — no server rate limit)
  let spotifyAlbums: SearchResult[] = [];
  let spotifyArtists: ArtistResult[] = [];

  try {
    const tokenRes = await fetch("/api/spotify-token");
    if (tokenRes.ok) {
      const { token } = await tokenRes.json();
      if (token) {
        const res = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album,artist&limit=9`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();

          spotifyAlbums = ((data.albums?.items ?? []) as Record<string, unknown>[])
            .filter(a => {
              if (a.album_type === "single") return false;
              const name = a.name as string;
              const artist = (a.artists as { name: string }[])?.[0]?.name ?? "";
              return okArtist(name) && okArtist(artist);
            })
            .map(a => ({
              name: a.name as string,
              artist: (a.artists as { name: string }[])?.[0]?.name ?? "",
              image: (a.images as { url: string }[])?.[0]?.url ?? null,
              mbid: null,
              url: (a.external_urls as Record<string, string>)?.spotify ?? null,
            }));

          spotifyArtists = ((data.artists?.items ?? []) as Record<string, unknown>[])
            .filter(a => {
              if (!okArtist(a.name as string)) return false;
              const followers = (a.followers as { total: number })?.total ?? 0;
              const popularity = (a.popularity as number) ?? 0;
              return followers > 0 || popularity > 0;
            })
            .slice(0, 3)
            .map(a => ({
              name: a.name as string,
              image: (a.images as { url: string }[])?.[0]?.url ?? null,
            }));
        }
      }
    }
  } catch { /* fall through */ }

  // Always fetch iTunes for extra album coverage + artist fallback in parallel
  const [itunesRaw, artistFallbackRaw] = await Promise.all([
    fetch(`/api/search?q=${encodeURIComponent(clean)}&source=itunes`).then(r => r.json()).catch(() => []),
    spotifyArtists.length === 0
      ? fetch(`/api/search-artists?q=${encodeURIComponent(query)}`).then(r => r.json()).catch(() => [])
      : Promise.resolve([]),
  ]);

  const itunesAlbums: SearchResult[] = Array.isArray(itunesRaw) ? itunesRaw : [];
  const artists: ArtistResult[] = spotifyArtists.length > 0
    ? spotifyArtists
    : (Array.isArray(artistFallbackRaw) ? artistFallbackRaw : []);

  const albums = dedupAlbums([...spotifyAlbums, ...itunesAlbums]).slice(0, 9);

  return { albums, artists };
}

export async function searchAlbums(query: string): Promise<SearchResult[]> {
  const { albums } = await searchAlbumsAndArtists(query);
  return albums;
}

export async function searchArtists(query: string): Promise<ArtistResult[]> {
  const { artists } = await searchAlbumsAndArtists(query);
  return artists;
}
