import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";

// A production build serves only nursing students and nursing staff, on every read of the session.
// Outside production any CMU account keeps working.

const env = process.env as Record<string, string | undefined>;
const require = createRequire(import.meta.url);

let sessionCookie: string | undefined;

// cookies() only works inside a request, so stand in for it before lib/cmu-auth loads.
const headersModule = require.resolve("next/headers");
require.cache[headersModule] = {
  id: headersModule,
  filename: headersModule,
  loaded: true,
  exports: {
    cookies: async () => ({
      get: (name: string) =>
        name === "cmu_session" && sessionCookie ? { value: sessionCookie } : undefined,
    }),
  },
} as never;

const profiles = {
  nursingStudent: { student_id: "671210001", cmuitaccount_name: "a" },
  otherFacultyStudent: { student_id: "671310001", cmuitaccount_name: "b" },
  nursingStaff: { organization_code: "12", cmuitaccount_name: "c" },
  otherFacultyStaff: { organization_code: "13", cmuitaccount_name: "d" },
  noFacultyData: { cmuitaccount_name: "e" },
};

async function sessionFor(profile: object, nodeEnv: string) {
  const saved = { NODE_ENV: env.NODE_ENV, SESSION_SECRET: env.SESSION_SECRET };
  env.SESSION_SECRET = "a-test-session-secret-of-32-chars-or-more";
  env.NODE_ENV = nodeEnv;
  try {
    const { getCmuSession, seal } = await import("../lib/cmu-auth");
    sessionCookie = seal({ profile, loggedInAt: Date.now(), expiresAt: Date.now() + 60_000 });
    return await getCmuSession();
  } finally {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete env[name];
      else env[name] = value;
    }
  }
}

test("production accepts a nursing student and nursing staff", async () => {
  assert.ok(await sessionFor(profiles.nursingStudent, "production"));
  assert.ok(await sessionFor(profiles.nursingStaff, "production"));
});

test("production refuses every other CMU account, even with a valid session", async () => {
  assert.equal(await sessionFor(profiles.otherFacultyStudent, "production"), null);
  assert.equal(await sessionFor(profiles.otherFacultyStaff, "production"), null);
  assert.equal(await sessionFor(profiles.noFacultyData, "production"), null);
});

test("outside production any CMU account keeps its session", async () => {
  assert.ok(await sessionFor(profiles.otherFacultyStudent, "development"));
  assert.ok(await sessionFor(profiles.otherFacultyStaff, "development"));
});
