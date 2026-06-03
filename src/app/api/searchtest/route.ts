import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  const hasId = !!clientId;
  const hasSecret = !!clientSecret;

  // Try to get a token
  let tokenStatus = "not attempted";
  let searchStatus = "not attempted";

  if (hasId && hasSecret) {
    try {
      const credentials = btoa(`${clientId}:${clientSecret}`);
      const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
        cache: "no-store",
      });
      const tokenText = await tokenRes.text();
      tokenStatus = `${tokenRes.status}: ${tokenText.slice(0, 100)}`;

      if (tokenRes.ok) {
        const tokenData = JSON.parse(tokenText);
        const searchRes = await fetch(
          "https://api.spotify.com/v1/search?q=oasis&type=album&limit=5",
          { headers: { Authorization: `Bearer ${tokenData.access_token}` }, cache: "no-store" }
        );
        const searchText = await searchRes.text();
        searchStatus = `${searchRes.status}: ${searchText.slice(0, 200)}`;
      }
    } catch (e) {
      tokenStatus = `error: ${e}`;
    }
  }

  return NextResponse.json({ hasId, hasSecret, tokenStatus, searchStatus });
}
