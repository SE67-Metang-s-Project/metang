import { NextResponse, after } from "next/server";
import type { NextRequest } from "next/server";
import { detectJobRunner } from "@/lib/jobs/runtime";
import { RETURN_PATH_HEADER } from "@/lib/return-path";

// Forwards the current pathname + search to Server Components, so the page guards in
// lib/loan-auth.ts can send an unauthenticated user to /login?next=<original page>.
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  // `set` overwrites any value the client sent for this header.
  requestHeaders.set(RETURN_PATH_HEADER, `${request.nextUrl.pathname}${request.nextUrl.search}`);

  // A host that freezes idle instances (JOB_RUNNER=request) has no timers, so the due jobs run
  // after a page request is answered. See lib/jobs/start-scheduler.ts.
  if (detectJobRunner(process.env).kind === "on-request") {
    after(async () => {
      const { runDueJobs } = await import("@/lib/jobs/start-scheduler");
      await runDueJobs();
    });
  }

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
  ],
};
