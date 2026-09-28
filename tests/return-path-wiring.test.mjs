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

test("callback error redirects still go to plain /login with an error code", () => {
  for (const code of ["access_denied", "invalid_callback", "invalid_state", "login_failed"]) {
    assert.match(callback, new RegExp(`redirectCallback\\(request, "/login", "${code}"\\)`));
  }
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
