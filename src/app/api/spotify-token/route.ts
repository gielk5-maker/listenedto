import { NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotify";

export const runtime = "nodejs";

export async function GET() {
  const token = await getSpotifyToken();
  if (!token) return NextResponse.json({ error: "no token" }, { status: 500 });
  return NextResponse.json({ token });
}
