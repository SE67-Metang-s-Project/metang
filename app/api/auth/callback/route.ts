import { NextRequest, NextResponse } from "next/server";
import {
  CMU_OAUTH_COOKIE,
  CMU_SESSION_COOKIE,
  SESSION_MAX_AGE,
  getCmuAuthConfig,
  sanitizeCmuProfile,
  seal,
  unseal,
  valuesMatch,
  type CmuSession,
  type OAuthTransaction,
} from "@/lib/cmu-auth";
import { getNurseAccessDecision } from "@/lib/nurse-auth";

type TokenResponse = {
  access_token?: string;
  error?: string;
};

function redirectHome(request: NextRequest, error?: string) {
  const url = new URL("/", request.nextUrl.origin);

  if (error) {
    url.searchParams.set("error", error);
  }

  const response = NextResponse.redirect(url);
  response.cookies.set(CMU_OAUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export async function GET(request: NextRequest) {
  const providerError = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const transactionCookie = request.cookies.get(CMU_OAUTH_COOKIE)?.value;

  if (providerError) {
    return redirectHome(request, "access_denied");
  }

  if (!code || !state || !transactionCookie) {
    return redirectHome(request, "invalid_callback");
  }

  const transaction = unseal<OAuthTransaction>(transactionCookie);

  if (
    !transaction ||
    transaction.expiresAt <= Date.now() ||
    !valuesMatch(state, transaction.state)
  ) {
    return redirectHome(request, "invalid_state");
  }

  try {
    const config = getCmuAuthConfig();
    const tokenResponse = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.callbackUrl,
        scope: config.scope,
        code,
        code_verifier: transaction.codeVerifier,
      }),
      cache: "no-store",
    });
    const token = (await tokenResponse.json().catch(() => null)) as TokenResponse | null;

    if (!tokenResponse.ok || !token?.access_token) {
      console.error("CMU token exchange failed", tokenResponse.status, token?.error);
      return redirectHome(request, "token_exchange_failed");
    }

    const basicInfoResponse = await fetch(config.basicInfoUrl, {
      headers: { Authorization: `Bearer ${token.access_token}` },
      cache: "no-store",
    });
    const basicInfo = await basicInfoResponse.json().catch(() => null);
    const profile = sanitizeCmuProfile(basicInfo);

    if (!basicInfoResponse.ok || !profile) {
      console.error("CMU BasicInfo request failed", basicInfoResponse.status);
      return redirectHome(request, "profile_failed");
    }

    if (transaction.mode === "nurse") {
      const accessDecision = getNurseAccessDecision(profile);

      if (!accessDecision.allowed) {
        console.info("CMU nursing SSO rejected by access policy", {
          userType: accessDecision.userType,
          reason: accessDecision.reason,
        });
        const response = redirectHome(request, "not_eligible");
        response.cookies.set(CMU_SESSION_COOKIE, "", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 0,
        });

        return response;
      }
    }

    const session: CmuSession = {
      profile,
      loggedInAt: Date.now(),
      expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
    };
    const response = redirectHome(request);
    response.cookies.set(CMU_SESSION_COOKIE, seal(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("CMU login callback failed", error);
    return redirectHome(request, "login_failed");
  }
}
