import { NextResponse } from "next/server";
import {
  CMU_OAUTH_COOKIE,
  CMU_SESSION_COOKIE,
  expireRootPathCookies,
  getCmuAuthConfig,
} from "@/lib/cmu-auth";
import { COOKIE_PATH, withBasePath } from "@/lib/base-path";
import { getPublicOrigin } from "@/lib/public-origin";

function handleLogout(request: Request) {
  const origin = getPublicOrigin(request);
  const federated = new URL(request.url).searchParams.get("federated") === "true";
  // NextResponse.redirect and new URL() do not add the base path.
  const loginPath = withBasePath("/login");

  let redirectUrl: URL;
  if (federated) {
    try {
      redirectUrl = new URL(getCmuAuthConfig().logoutUrl);
      // Replaces any post_logout_redirect_uri in LOGOUT_URL. CMU Entra must have this exact address
      // registered (<origin>/<sub path>/login), or it will not send the browser back.
      redirectUrl.searchParams.set("post_logout_redirect_uri", new URL(loginPath, origin).href);
    } catch {
      redirectUrl = new URL(loginPath, origin);
    }
  } else {
    redirectUrl = new URL(loginPath, origin);
  }

  const response = NextResponse.redirect(redirectUrl, 303);

  // Clear session cookie
  response.cookies.set(CMU_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: COOKIE_PATH,
    maxAge: 0,
  });

  // Clear oauth transaction cookie if present
  response.cookies.set(CMU_OAUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: COOKIE_PATH,
    maxAge: 0,
  });

  // Sessions issued before the cookies were scoped to the base path live at "/".
  expireRootPathCookies(response, CMU_SESSION_COOKIE, CMU_OAUTH_COOKIE);

  return response;
}

export async function POST(request: Request) {
  return handleLogout(request);
}

export async function GET(request: Request) {
  return handleLogout(request);
}
