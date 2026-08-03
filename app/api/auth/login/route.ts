import { NextResponse } from "next/server";
import {
  CMU_OAUTH_COOKIE,
  OAUTH_TRANSACTION_MAX_AGE,
  createOAuthState,
  createPkcePair,
  getCmuAuthConfig,
  seal,
  type OAuthTransaction,
} from "@/lib/cmu-auth";

export async function GET(request: Request) {
  try {
    const config = getCmuAuthConfig();
    const state = createOAuthState();
    const { codeVerifier, codeChallenge } = createPkcePair();
    const transaction: OAuthTransaction = {
      state,
      codeVerifier,
      expiresAt: Date.now() + OAUTH_TRANSACTION_MAX_AGE * 1000,
    };
    const authorizationUrl = new URL(config.authorizationUrl);

    authorizationUrl.searchParams.set("client_id", config.clientId);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("redirect_uri", config.callbackUrl);
    authorizationUrl.searchParams.set("response_mode", "query");
    authorizationUrl.searchParams.set("scope", config.scope);
    authorizationUrl.searchParams.set("state", state);
    authorizationUrl.searchParams.set("code_challenge", codeChallenge);
    authorizationUrl.searchParams.set("code_challenge_method", "S256");

    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set(CMU_OAUTH_COOKIE, seal(transaction), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: OAUTH_TRANSACTION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Unable to start CMU login", error);
    return NextResponse.redirect(new URL("/?error=configuration", request.url));
  }
}
