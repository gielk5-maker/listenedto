// Use global to persist token across warm serverless invocations
declare global {
  // eslint-disable-next-line no-var
  var _spotifyToken: string | null;
  // eslint-disable-next-line no-var
  var _spotifyTokenExpiry: number;
}
global._spotifyToken = global._spotifyToken ?? null;
global._spotifyTokenExpiry = global._spotifyTokenExpiry ?? 0;

export async function getSpotifyToken(): Promise<string | null> {
  if (global._spotifyToken && Date.now() < global._spotifyTokenExpiry) {
    return global._spotifyToken;
  }

  const credentials = btoa(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  );

  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.access_token) return null;

    global._spotifyToken = data.access_token;
    global._spotifyTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return global._spotifyToken;
  } catch {
    return null;
  }
}
