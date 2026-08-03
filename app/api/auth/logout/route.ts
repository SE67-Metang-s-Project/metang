import { NextResponse } from "next/server";
import { CMU_SESSION_COOKIE, getCmuAuthConfig } from "@/lib/cmu-auth";

export async function POST(request: Request) {
  let redirectUrl: URL;

  try {
    redirectUrl = new URL(getCmuAuthConfig().logoutUrl);
  } catch (error) {
    console.error("Unable to create CMU logout URL", error);
    redirectUrl = new URL("/", request.url);
  }

  const response = NextResponse.redirect(redirectUrl, 303);
  response.cookies.set(CMU_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
