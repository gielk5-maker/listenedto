import { type NextRequest, NextResponse } from "next/server";

// Auth checks happen in page components (Node.js runtime) where
// cookies are accessible. The Edge runtime strips non-Vercel cookies.
export function proxy(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
