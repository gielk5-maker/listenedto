import { getSpotifyToken } from "@/lib/spotify";

export async function getArtistImages(names: string[]): Promise<Record<string, string | null>> {
  if (names.length === 0) return {};

  const token = await getSpotifyToken();
  if (!token) return Object.fromEntries(names.map(n => [n, null]));

  const results = await Promise.all(
    names.map(async (name) => {
      try {
        const res = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1`,
          { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 86400 } }
        );
        if (!res.ok) return [name, null] as const;
        const data = await res.json();
        return [name, data.artists?.items?.[0]?.images?.[0]?.url ?? null] as const;
      } catch {
        return [name, null] as const;
      }
    })
  );

  return Object.fromEntries(results);
}
