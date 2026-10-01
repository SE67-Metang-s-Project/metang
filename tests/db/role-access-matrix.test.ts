import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";

// Every signed-in actor against every role's access function, on the real lookups against the
// seeded database: no dev bypass, no Prisma stub. Needs the seed, so `npm run api:test` runs it
// against its throwaway container before Bruno can change any role; the unit glob skips tests/db/.
// tests/role-path-guards.test.mjs pins that each page and API path uses its role's function.

const env = process.env as Record<string, string | undefined>;
if (!env.DATABASE_URL) throw new Error("role-access-matrix needs DATABASE_URL; run it via npm run api:test");

// Real sign-in path only: these would swap every lookup for a fixed dev fixture.
for (const name of [
  "INFISICAL_ENV",
  "DEBUG_MODE",
  "DEV_API_BYPASS",
  "DEV_AS_ADVISOR",
  "DEV_AS_ADMIN",
  "DEV_AS_SUPERADMIN",
  "DEV_AS_EXECUTIVE",
]) {
  delete env[name];
}
env.NODE_ENV = "test";
env.SESSION_SECRET = "a-test-session-secret-of-32-chars-or-more";

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
    headers: async () => new Headers(),
  },
} as never;
// next/navigation does not load under react-server; only the require* guards redirect, and this
// calls the get*Access functions they wrap.
const navigationModule = require.resolve("next/navigation");
require.cache[navigationModule] = {
  id: navigationModule,
  filename: navigationModule,
  loaded: true,
  exports: {},
} as never;

// Loaded after the stand-in and the env above; tsx emits CommonJS, so no top-level await.
const modules = (async () => ({
  cmuAuth: await import("../../lib/cmu-auth"),
  auth: await import("../../lib/loan-auth"),
}))();
type Auth = Awaited<typeof modules>["auth"];

const GATES = {
  student: (auth: Auth) => auth.getStudentAccess(),
  advisor: (auth: Auth) => auth.getAdvisorAccess(),
  admin: (auth: Auth) => auth.getAdminAccess(),
  super_admin: (auth: Auth) => auth.getSuperAdminAccess(),
  executive: (auth: Auth) => auth.getExecutiveAccess(),
} as const;
type Gate = keyof typeof GATES;
type Outcome = "authorized" | "forbidden" | "unauthenticated";

const staff = (cmuitaccount_name: string) => ({ cmuitaccount_name, organization_code: "12" });

// Staff accounts are the seed's app_user fixtures (db/seed.ts); students have no app_user row.
const ACTORS: Record<string, { profile: object | null; authorized: Gate[] }> = {
  "nursing student": {
    profile: { student_id: "671210001", cmuitaccount_name: "nursing.student" },
    authorized: ["student"],
  },
  "other-faculty student": {
    profile: { student_id: "671310001", cmuitaccount_name: "other.student" },
    authorized: [],
  },
  advisor: { profile: staff("supawadee.wongkham"), authorized: ["advisor"] },
  admin: { profile: staff("kamonchanok.saengthong"), authorized: ["admin"] },
  // super_admin passes the admin gate by design (hasAdminRole).
  super_admin: { profile: staff("thanawat.intaraprasert"), authorized: ["admin", "super_admin"] },
  // The seeded executive also holds advisor.
  executive: { profile: staff("wannapa.srithanyarat"), authorized: ["advisor", "executive"] },
  "staff without an app_user row": { profile: staff("not.a.fixture"), authorized: [] },
  "signed-out visitor": { profile: null, authorized: [] },
};

async function outcome(profile: object | null, gate: Gate): Promise<Outcome> {
  const { cmuAuth, auth } = await modules;
  sessionCookie = profile
    ? cmuAuth.seal({ profile, loggedInAt: Date.now(), expiresAt: Date.now() + 60_000 })
    : undefined;
  return (await GATES[gate](auth)).status;
}

for (const [actor, { profile, authorized }] of Object.entries(ACTORS)) {
  for (const gate of Object.keys(GATES) as Gate[]) {
    const expected: Outcome =
      profile === null ? "unauthenticated" : authorized.includes(gate) ? "authorized" : "forbidden";

    test(`${actor} -> ${gate} access is ${expected}`, async () => {
      assert.equal(await outcome(profile, gate), expected);
    });
  }
}

test("matrix teardown closes the database pool", async () => {
  await (await import("../../lib/prisma")).prisma.$disconnect();
});
