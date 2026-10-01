import assert from "node:assert/strict";
import { test } from "node:test";
import { CMU_OAUTH_COOKIE, unseal } from "../lib/cmu-auth";
import { GET as getLogin } from "../app/api/auth/login/route";

// The sign-in button links to /api/auth/login. A production build must start the nursing policy
// mode, so a non-nursing account is refused at sign-in with not_eligible. Only NODE_ENV decides:
// INFISICAL_ENV only picks which shared secrets are loaded and must not change the mode.

const env = process.env as Record<string, string | undefined>;
const changed: Record<string, string | undefined> = {
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

async function loginMode(infisicalEnv: string | undefined, nodeEnv: string | undefined) {
  const names = [...Object.keys(changed), "INFISICAL_ENV", "NODE_ENV"];
  const saved = Object.fromEntries(names.map((name) => [name, env[name]]));
  Object.assign(env, changed, { INFISICAL_ENV: infisicalEnv, NODE_ENV: nodeEnv });
  for (const name of ["INFISICAL_ENV", "NODE_ENV"]) if (env[name] === undefined) delete env[name];
  try {
    const response = await getLogin(new Request("https://metang.example/metang/api/auth/login"));
    const cookie = response.headers
      .getSetCookie()
      .map((header) => header.split(";")[0])
      .find((pair) => pair.startsWith(`${CMU_OAUTH_COOKIE}=`));
    assert.ok(cookie, "the OAuth transaction cookie is set");
    return unseal<{ mode: string }>(cookie.slice(CMU_OAUTH_COOKIE.length + 1))?.mode;
  } finally {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete env[name];
      else env[name] = value;
    }
  }
}

test("sign-in starts the nursing policy mode in production", async () => {
  assert.equal(await loginMode("prod", "production"), "nurse");
});

test("INFISICAL_ENV does not change the mode of a production build", async () => {
  assert.equal(await loginMode(undefined, "production"), "nurse");
  assert.equal(await loginMode("dev", "production"), "nurse");
});

test("sign-in keeps the general mode in development whatever INFISICAL_ENV is", async () => {
  assert.equal(await loginMode("dev", "development"), "general");
  assert.equal(await loginMode("prod", "development"), "general");
  assert.equal(await loginMode(undefined, "development"), "general");
});
