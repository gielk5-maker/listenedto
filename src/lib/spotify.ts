let cachedToken: string | null = null;
let tokenVerlooptOp = 0;

export async function getSpotifyToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenVerlooptOp) {
    return cachedToken;
  }

  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  cachedToken = data.access_token;
  tokenVerlooptOp = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken!;
}
