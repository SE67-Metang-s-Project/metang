import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { RETURN_PATH_HEADER } from "@/lib/return-path";

// Forwards the current pathname + search to Server Components, so the page guards in
// lib/loan-auth.ts can send an unauthenticated user to /login?next=<original page>.
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  // `set` overwrites any value the client sent for this header.
  requestHeaders.set(RETURN_PATH_HEADER, `${request.nextUrl.pathname}${request.nextUrl.search}`);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/advisor/:path*",
    "/demo/:path*",
    "/executive/:path*",
    "/student/:path*",
    "/superadmin/:path*",
    "/user/:path*",
  ],
};
