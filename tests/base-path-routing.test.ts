import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { BASE_PATH, withBasePath } from "../lib/base-path";
import nextConfig from "../next.config";
import { GET as getOpenApi } from "../app/api/openapi/route";
import { GET as getLogout } from "../app/api/auth/logout/route";

// Server responses must point under the base path themselves: Next.js adds it to redirect() and
// <Link>, but not to new URL(), NextResponse.redirect or a hand-built Location header.

const root = resolve(import.meta.dirname, "..");

test("every root-path redirect in next.config.ts sends to the same path under the base path", async () => {
  const redirects = await nextConfig.redirects!();
  assert.ok(redirects.length > 0);
  for (const redirect of redirects) {
    const expected = redirect.source === "/" ? BASE_PATH : withBasePath(redirect.source);
    assert.equal(redirect.destination, expected, redirect.source);
    assert.equal(redirect.basePath, false, redirect.source);
    assert.equal(redirect.permanent, false, redirect.source);
  }
});

test("next.config.ts redirects /openapi.json, which 404s without the base path", async () => {
  const sources = (await nextConfig.redirects!()).map((redirect) => redirect.source);
  assert.ok(sources.includes("/openapi.json"));
});

test("both Bruno environments call the API under the base path", () => {
  for (const file of ["bruno/environments/local.yml", "bruno/environments/isolated.yml"]) {
    const source = readFileSync(resolve(root, file), "utf8");
    const baseUrl = source.match(/name: baseUrl\s+value: (\S+)/)?.[1];
    assert.ok(baseUrl, file);
    assert.ok(baseUrl.endsWith(`${BASE_PATH}/api`), `${file}: ${baseUrl}`);
  }
});

test("/api/openapi redirects to the spec under the base path, with no build-time origin", () => {
  const response = getOpenApi();
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), withBasePath("/openapi.json"));
});

test("logout sends the browser to the login page under the base path", async () => {
  const response = await getLogout(new Request("https://metang.example/metang/api/auth/logout"));
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "https://metang.example/metang/login");
});

test("federated logout returns to the login page under the base path, as registered in CMU Entra", async () => {
  const env: Record<string, string> = {
    AUTH_URL: "https://login.example/authorize",
    TOKEN_URL: "https://login.example/token",
    CALLBACK_URL: "https://metang.example/metang/api/auth/callback",
    CLIENT_ID: "client",
    CLIENT_SECRET: "secret",
    SCOPE: "openid",
    BASICINFO_URL: "https://login.example/basicinfo",
    LOGOUT_URL: "https://login.example/logout",
  };
  const saved = Object.fromEntries(Object.keys(env).map((name) => [name, process.env[name]]));
  Object.assign(process.env, env);
  try {
    const response = await getLogout(
      new Request("https://metang.example/metang/api/auth/logout?federated=true"),
    );
    const location = new URL(response.headers.get("location") ?? "");
    assert.equal(`${location.origin}${location.pathname}`, "https://login.example/logout");
    assert.equal(
      location.searchParams.get("post_logout_redirect_uri"),
      "https://metang.example/metang/login",
    );
  } finally {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
