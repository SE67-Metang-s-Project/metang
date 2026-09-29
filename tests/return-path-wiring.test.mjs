import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");

const callback = read("app/api/auth/callback/route.ts");
const cmuAuth = read("lib/cmu-auth.ts");
const startLogin = cmuAuth.slice(
  cmuAuth.indexOf("export function startCmuLogin"),
  cmuAuth.indexOf("export function valuesMatch"),
);
const loanAuth = read("lib/loan-auth.ts");
const loginPage = read("app/login/page.tsx");
const proxy = read("proxy.ts");

test("the callback redirects to the sanitized stored path, else to the role home path", () => {
  assert.match(callback, /const returnPath = sanitizeReturnPath\(transaction\.returnPath\);/);
  assert.match(callback, /destinationPath = returnPath \?\? \(await getUserHomePath\(profile\)\);/);
  assert.match(callback, /let destinationPath = returnPath \?\? "\/student";/);
  assert.match(callback, /redirectCallback\(request, destinationPath\)/);
});

test("callback error redirects go through redirectCallback with an app-root /login", () => {
  for (const code of ["access_denied", "invalid_callback", "invalid_state", "login_failed"]) {
    assert.match(callback, new RegExp(`redirectCallback\\(request, "/login", "${code}"\\)`));
  }
});

test("the callback adds the base path to every app-root destination it redirects to", () => {
  // Success and error redirects both go through redirectCallback, and NextResponse.redirect does
  // not add the base path the way redirect() from next/navigation does.
  // The origin is the public one (lib/public-origin.ts), not the address Next.js listens on.
  assert.match(callback, /new URL\(withBasePath\(destination\), getPublicOrigin\(request\)\)/);
  assert.equal(callback.match(/NextResponse\.redirect\(/g)?.length, 1);
});

test("return paths stay app-root from the proxy through the guard to the callback", () => {
  // The proxy forwards nextUrl.pathname (no base path); the guard hands the login URL to
  // redirect(), which adds the base path; only the callback turns the path into a URL.
  assert.match(proxy, /`\$\{request\.nextUrl\.pathname\}\$\{request\.nextUrl\.search\}`/);
  assert.match(loanAuth, /import \{ redirect \} from "next\/navigation";/);
  assert.doesNotMatch(loanAuth, /NextResponse\.redirect/);
});

test("the sign-in start falls back to the login page under the base path", () => {
  assert.match(
    startLogin,
    /URL\(withBasePath\("\/login\?error=configuration"\), getPublicOrigin\(request\)\)/,
  );
  assert.doesNotMatch(startLogin, /new URL\("\//);
});

test("startCmuLogin seals the sanitized next inside the OAuth transaction only", () => {
  assert.match(
    startLogin,
    /sanitizeReturnPath\(new URL\(request\.url\)\.searchParams\.get\("next"\)\)/,
  );
  assert.match(startLogin, /\.\.\.\(returnPath \? \{ returnPath \} : \{\}\)/);
  assert.match(startLogin, /response\.cookies\.set\(CMU_OAUTH_COOKIE, seal\(transaction\)/);
  assert.equal(startLogin.match(/cookies\.set\(/g)?.length, 1);
  assert.match(startLogin, /searchParams\.set\("state", state\)/);
});

test("the page guard adds the forwarded path to the login URL", () => {
  assert.match(loanAuth, /sanitizeReturnPath\(\(await headers\(\)\)\.get\(RETURN_PATH_HEADER\)\)/);
  assert.match(loanAuth, /loginUrl\.searchParams\.set\("next", returnPath\)/);
  assert.match(loanAuth, /redirect\(await withReturnPath\(loginRedirectUrl\)\)/);
});

test("the login page passes a sanitized next on to the sign-in route", () => {
  assert.match(loginPage, /sanitizeReturnPath\(/);
  assert.match(loginPage, /`\/api\/auth\/login\?next=\$\{encodeURIComponent\(returnPath\)\}`/);
  assert.match(loginPage, /href=\{loginHref\}/);
});

test("proxy forwards the path as a request header, not a response header", () => {
  assert.match(proxy, /requestHeaders\.set\(RETURN_PATH_HEADER,/);
  assert.match(proxy, /NextResponse\.next\(\{ request: \{ headers: requestHeaders \} \}\)/);
  assert.doesNotMatch(proxy, /export const runtime/);
});
