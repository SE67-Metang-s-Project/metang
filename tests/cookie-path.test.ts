import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { BASE_PATH, COOKIE_PATH } from "../lib/base-path";
import { CMU_OAUTH_COOKIE, CMU_SESSION_COOKIE, startCmuLogin } from "../lib/cmu-auth";
import { GET as getLogout } from "../app/api/auth/logout/route";

// The sign-in cookies are scoped to the base path, so other applications on the same domain do not
// receive them. Cookies issued before that were set at "/": logout and the callback expire those
// too.

const authEnv: Record<string, string> = {
  AUTH_URL: "https://login.example/authorize",
  TOKEN_URL: "https://login.example/token",
  CALLBACK_URL: "https://metang.example/metang/api/auth/callback",
  CLIENT_ID: "client",
  CLIENT_SECRET: "secret",
  SCOPE: "openid",
  BASICINFO_URL: "https://login.example/basicinfo",
  LOGOUT_URL: "https://login.example/logout",
  SESSION_SECRET: "a-test-session-secret-of-32-chars-or-more",
};

function withAuthEnv<T>(run: () => T): T {
  const saved = Object.fromEntries(Object.keys(authEnv).map((name) => [name, process.env[name]]));
  Object.assign(process.env, authEnv);
  try {
    return run();
  } finally {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

/** The Set-Cookie headers of a response as [name, attributes] pairs. */
function setCookies(response: Response) {
  return response.headers.getSetCookie().map((header) => {
    const [pair, ...attributes] = header.split(";").map((part) => part.trim());
    const separator = pair.indexOf("=");
    return { name: pair.slice(0, separator), value: pair.slice(separator + 1), attributes };
  });
}

function findCookie(response: Response, name: string, path: string) {
  return setCookies(response).find(
    (cookie) => cookie.name === name && cookie.attributes.includes(`Path=${path}`),
  );
}

test("the cookie path is the base path, or the root when the app is served from it", () => {
  assert.equal(BASE_PATH, "/metang");
  assert.equal(COOKIE_PATH, "/metang");
});

test("logout expires both cookies at the base path", async () => {
  const response = await getLogout(new Request("https://metang.example/metang/api/auth/logout"));

  for (const name of [CMU_SESSION_COOKIE, CMU_OAUTH_COOKIE]) {
    const cookie = findCookie(response, name, "/metang");
    assert.ok(cookie, name);
    assert.equal(cookie.value, "");
    assert.ok(cookie.attributes.includes("Max-Age=0"), name);
    assert.ok(cookie.attributes.includes("HttpOnly"), name);
  }
});

test("logout also expires the cookies that older sessions hold at the root path", async () => {
  const response = await getLogout(new Request("https://metang.example/metang/api/auth/logout"));

  for (const name of [CMU_SESSION_COOKIE, CMU_OAUTH_COOKIE]) {
    const cookie = findCookie(response, name, "/");
    assert.ok(cookie, name);
    assert.equal(cookie.value, "");
    assert.ok(cookie.attributes.includes("Max-Age=0"), name);
    assert.ok(cookie.attributes.includes("HttpOnly"), name);
  }
  // Two names at two paths: the root-path expiry must not replace the base-path one.
  assert.equal(setCookies(response).length, 4);
});

test("federated logout expires the cookies at both paths too", async () => {
  const response = await withAuthEnv(() =>
    getLogout(new Request("https://metang.example/metang/api/auth/logout?federated=true")),
  );

  assert.equal(new URL(response.headers.get("location") ?? "").origin, "https://login.example");
  for (const name of [CMU_SESSION_COOKIE, CMU_OAUTH_COOKIE]) {
    assert.ok(findCookie(response, name, "/metang"), name);
    assert.ok(findCookie(response, name, "/"), name);
  }
});

test("starting a CMU login sets the OAuth transaction cookie at the base path", () => {
  const response = withAuthEnv(() =>
    startCmuLogin(new Request("https://metang.example/metang/api/auth/login"), "general"),
  );

  const location = response.headers.get("location") ?? "";
  assert.ok(location.startsWith("https://login.example/authorize"), location);
  const cookies = setCookies(response);
  assert.equal(cookies.length, 1);
  assert.equal(cookies[0].name, CMU_OAUTH_COOKIE);
  assert.notEqual(cookies[0].value, "");
  assert.ok(cookies[0].attributes.includes("Path=/metang"));
  assert.ok(!cookies[0].attributes.includes("Path=/"));
  assert.ok(cookies[0].attributes.includes("HttpOnly"));
});

test("the callback clears the OAuth cookie at the base path and at the old root path", async () => {
  // The callback route imports the Prisma client, which needs a DATABASE_URL to load. This one is a
  // placeholder: the error redirect never queries, so nothing connects to a database. It also
  // imports next/navigation, which does not load under the react-server condition of `npm test`;
  // only redirect() would use it, and the error redirect does not call that.
  const require = createRequire(import.meta.url);
  const navigation = require.resolve("next/navigation");
  require.cache[navigation] = {
    id: navigation,
    filename: navigation,
    loaded: true,
    exports: {},
  } as never;
  const savedUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL ??= "postgresql://placeholder:placeholder@127.0.0.1:1/placeholder";
  let getCallback: typeof import("../app/api/auth/callback/route").GET;
  try {
    ({ GET: getCallback } = await import("../app/api/auth/callback/route"));
  } finally {
    if (savedUrl === undefined) delete process.env.DATABASE_URL;
  }
  const response = await getCallback(
    new NextRequest("https://metang.example/metang/api/auth/callback?error=access_denied"),
  );

  assert.equal(response.status, 307);
  assert.equal(
    response.headers.get("location"),
    "https://metang.example/metang/login?error=access_denied",
  );
  const cookies = setCookies(response);
  assert.equal(cookies.length, 2);
  for (const path of ["/metang", "/"]) {
    const cookie = findCookie(response, CMU_OAUTH_COOKIE, path);
    assert.ok(cookie, path);
    assert.equal(cookie.value, "");
    assert.ok(cookie.attributes.includes("Max-Age=0"), path);
  }
  // No session was set or cleared, so the old session cookie is left alone.
  assert.equal(cookies.filter((cookie) => cookie.name === CMU_SESSION_COOKIE).length, 0);
});
