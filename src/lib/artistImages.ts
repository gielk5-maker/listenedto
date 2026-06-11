import { unstable_cache } from "next/cache";
import { getSpotifyToken } from "@/lib/spotify";

const fetchOneArtistImage = unstable_cache(
  async (name: string): Promise<string | null> => {
    const token = await getSpotifyToken();
    if (!token) return null;
    try {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return data.artists?.items?.[0]?.images?.[0]?.url ?? null;
    } catch {
      return null;
    }
  },
  ["artist-image"],
  { revalidate: 86400 }
);

export async function getArtistImages(names: string[]): Promise<Record<string, string | null>> {
  if (names.length === 0) return {};

  // Sequential to avoid Spotify rate limits
  const result: Record<string, string | null> = {};
  for (const name of names) {
    result[name] = await fetchOneArtistImage(name);
  }
  return result;
}
