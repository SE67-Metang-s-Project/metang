import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";

// Where a sign-in lands (getUserHomePath), on the real role lookup against the seeded database.
// The account's own role comes first; a dev shortcut only picks the page for an account that has
// no role and is not a student. Runs through `npm run api:test` like role-access-matrix.

const env = process.env as Record<string, string | undefined>;
if (!env.DATABASE_URL) throw new Error("home-path needs DATABASE_URL; run it via npm run api:test");

const DEV_FLAGS = [
  "INFISICAL_ENV",
  "DEBUG_MODE",
  "DEV_API_BYPASS",
  "DEV_AS_ADVISOR",
  "DEV_AS_ADMIN",
  "DEV_AS_SUPERADMIN",
  "DEV_AS_EXECUTIVE",
];
function setFlags(flags: Record<string, string>) {
  for (const name of DEV_FLAGS) delete env[name];
  Object.assign(env, flags);
}
env.NODE_ENV = "test";
env.SESSION_SECRET = "a-test-session-secret-of-32-chars-or-more";

// loan-auth imports next/headers and next/navigation; getUserHomePath calls neither.
const require = createRequire(import.meta.url);
for (const id of ["next/headers", "next/navigation"]) {
  const resolved = require.resolve(id);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports: {} } as never;
}

const homePath = async (profile: object) =>
  (await import("../../lib/loan-auth")).getUserHomePath(profile as never);

const staff = (cmuitaccount_name: string) => ({ cmuitaccount_name, organization_code: "12" });
const FORBIDDEN = "/error?type=forbidden";

// Seeded app_user fixtures (db/seed.ts), as in role-access-matrix.
const ACCOUNTS = {
  advisor: { profile: staff("supawadee.wongkham"), home: "/advisor" },
  admin: { profile: staff("kamonchanok.saengthong"), home: "/admin" },
  super_admin: { profile: staff("thanawat.intaraprasert"), home: "/superadmin" },
  executive: { profile: staff("wannapa.srithanyarat"), home: "/executive" },
  student: {
    profile: { student_id: "671210001", cmuitaccount_name: "nursing.student" },
    home: "/student",
  },
};
const NO_ROLE = staff("not.a.fixture");

test("without a dev flag every account lands on its own role page", async () => {
  setFlags({});
  for (const [name, { profile, home }] of Object.entries(ACCOUNTS)) {
    assert.equal(await homePath(profile), home, name);
  }
  assert.equal(await homePath(NO_ROLE), FORBIDDEN);
});

test("DEV_AS_* with DEBUG_MODE does not move an account that has a role or is a student", async () => {
  setFlags({ DEBUG_MODE: "true", DEV_AS_ADVISOR: "true", DEV_AS_SUPERADMIN: "true" });
  for (const [name, { profile, home }] of Object.entries(ACCOUNTS)) {
    assert.equal(await homePath(profile), home, name);
  }
});

test("a dev shortcut only picks the page for an account with no role", async () => {
  setFlags({ DEBUG_MODE: "true", DEV_AS_ADVISOR: "true", DEV_AS_ADMIN: "true" });
  assert.equal(await homePath(NO_ROLE), "/admin");

  setFlags({ DEBUG_MODE: "true", DEV_API_BYPASS: "true" });
  assert.equal(await homePath(NO_ROLE), "/student");
});

test("DEV_AS_* without DEBUG_MODE on a non-development build sends nobody anywhere", async () => {
  setFlags({ DEV_AS_ADVISOR: "true", DEV_API_BYPASS: "true" });
  assert.equal(await homePath(NO_ROLE), FORBIDDEN);
});

test("home-path teardown closes the database pool", async () => {
  await (await import("../../lib/prisma")).prisma.$disconnect();
});
