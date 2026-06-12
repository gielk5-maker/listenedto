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

export async function searchAlbumsAndArtists(query: string): Promise<{ albums: SearchResult[]; artists: ArtistResult[] }> {
  try {
    const res = await fetch(`/api/albums-and-artists?q=${encodeURIComponent(query.trim())}`);
    if (!res.ok) return { albums: [], artists: [] };
    return await res.json();
  } catch {
    return { albums: [], artists: [] };
  }
}

export async function searchAlbums(query: string): Promise<SearchResult[]> {
  const { albums } = await searchAlbumsAndArtists(query);
  return albums;
}

export async function searchArtists(query: string): Promise<ArtistResult[]> {
  const { artists } = await searchAlbumsAndArtists(query);
  return artists;
}
