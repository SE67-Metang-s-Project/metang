import { NextResponse } from "next/server";
import { CMU_OAUTH_COOKIE, CMU_SESSION_COOKIE, getCmuAuthConfig } from "@/lib/cmu-auth";

function handleLogout(request: Request) {
  const url = new URL(request.url);
  const federated = url.searchParams.get("federated") === "true";

  let redirectUrl: URL;
  if (federated) {
    try {
      redirectUrl = new URL(getCmuAuthConfig().logoutUrl);
      redirectUrl.searchParams.set("post_logout_redirect_uri", `${url.origin}/login`);
    } catch {
      redirectUrl = new URL("/login", request.url);
    }
  } else {
    redirectUrl = new URL("/login", request.url);
  }

  const response = NextResponse.redirect(redirectUrl, 303);

  // Clear session cookie
  response.cookies.set(CMU_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  // Clear oauth transaction cookie if present
  response.cookies.set(CMU_OAUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export async function POST(request: Request) {
  return handleLogout(request);
}

export async function GET(request: Request) {
  return handleLogout(request);
}
