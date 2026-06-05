import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const sbCookies = allCookies.filter(c => c.name.startsWith("sb-"));
  
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  return NextResponse.json({
    totalCookies: allCookies.length,
    cookieNames: allCookies.map(c => c.name),
    sbCookieCount: sbCookies.length,
    sbCookieNames: sbCookies.map(c => c.name),
    hasSession: !!session,
    sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
    error: error?.message ?? null,
  });
}
