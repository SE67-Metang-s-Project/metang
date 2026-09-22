// Runs the Bruno collection against a throwaway Postgres container instead of the shared dev
// database, so the mutating requests can write freely and every run starts from the same seed.
// Deliberately does NOT go through scripts/with-infisical.mjs: that wrapper injects the real
// DATABASE_URL, which would point the migrations and the seed at the team database.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createConnection } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CONTAINER = "metang-test";
const PG_PORT = 5433;
const APP_PORT = 8081;
const DATABASE_URL = `postgresql://postgres:test@localhost:${PG_PORT}/postgres`;

const PG_READY_TIMEOUT_MS = 60_000;
const APP_READY_TIMEOUT_MS = 120_000;

const run = (command, args, options = {}) =>
  spawnSync(command, args, { cwd: root, stdio: "inherit", ...options });

const quiet = (command, args) =>
  spawnSync(command, args, { cwd: root, stdio: "pipe", encoding: "utf8" });

function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

/** The team database is the thing worth protecting - refuse anything that is not local. */
function assertLocalDatabase() {
  const { hostname } = new URL(DATABASE_URL);
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    fail(`refusing to migrate a non-local database (${hostname})`);
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function portInUse(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: "127.0.0.1" });
    socket.once("connect", () => (socket.destroy(), resolve(true)));
    socket.once("error", () => resolve(false));
    socket.setTimeout(1000, () => (socket.destroy(), resolve(false)));
  });
}

/**
 * Next allows one dev server per directory: a second one prints a normal banner, binds for a
 * moment, then exits, so the whole suite would fail with ECONNREFUSED long after the container is
 * up. `.next/dev/lock` names the process holding the slot, so the conflict is knowable up front.
 */
function assertNoOtherDevServer() {
  const lockPath = path.join(root, ".next/dev/lock");
  if (!existsSync(lockPath)) return;

  let lock;
  try {
    lock = JSON.parse(readFileSync(lockPath, "utf8"));
  } catch {
    return; // Half-written or unreadable - not worth blocking a run over.
  }
  if (!lock?.pid) return;

  try {
    process.kill(lock.pid, 0); // Signal 0 tests liveness without touching the process.
  } catch {
    return; // Stale lock left by a crashed server.
  }

  fail(
    `another next dev server is running (pid ${lock.pid}, ${lock.appUrl ?? "unknown url"}). ` +
      `Next allows one per directory - stop it (\`npm run dev\`) and retry.`,
  );
}

async function preflight() {
  assertNoOtherDevServer();

  if (quiet("docker", ["--version"]).status !== 0) {
    fail("docker is required. Install it, or run the collection manually - see bruno/README.md.");
  }

  // A stale listener here would silently serve the tests from the wrong database.
  if (await portInUse(APP_PORT)) {
    fail(`port ${APP_PORT} is already in use; stop whatever holds it and retry`);
  }

  if (!existsSync(path.join(root, "lib/generated/prisma"))) {
    console.log("→ generating Prisma client");
    if (run("npx", ["prisma", "generate"]).status !== 0) fail("prisma generate failed");
  }
}

async function startDatabase() {
  quiet("docker", ["rm", "-f", CONTAINER]);

  console.log(`→ starting ${CONTAINER} (postgres:17) on ${PG_PORT}`);
  const started = run("docker", [
    "run",
    "--rm",
    "-d",
    "--name",
    CONTAINER,
    "-p",
    `${PG_PORT}:5432`,
    "-e",
    "POSTGRES_PASSWORD=test",
    "postgres:17",
  ]);
  if (started.status !== 0) fail("could not start the postgres container");

  // `docker run -d` returns before Postgres accepts connections; migrating now would race it.
  const deadline = Date.now() + PG_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (quiet("docker", ["exec", CONTAINER, "pg_isready", "-U", "postgres"]).status === 0) {
      console.log("→ postgres ready");
      return;
    }
    await sleep(500);
  }
  fail(`postgres did not become ready within ${PG_READY_TIMEOUT_MS / 1000}s`);
}

const childEnv = {
  ...process.env,
  DATABASE_URL,
  DIRECT_URL: DATABASE_URL,
  // Both are required by isDevelopmentEnvironment() before any dev bypass is honoured.
  INFISICAL_ENV: "dev",
  NODE_ENV: "development",
  DEV_API_BYPASS: "true",
  DEV_AS_ADVISOR: "true",
  DEV_AS_ADMIN: "true",
  DEV_AS_SUPERADMIN: "true",
  DEV_AS_EXECUTIVE: "true",
};

function migrateAndSeed() {
  console.log("→ applying migrations");
  if (run("npx", ["prisma", "migrate", "deploy"], { env: childEnv }).status !== 0) {
    fail("prisma migrate deploy failed");
  }

  console.log("→ seeding fixtures");
  if (run("npx", ["tsx", "db/seed.ts"], { env: childEnv }).status !== 0) fail("seed failed");
}

/** Last lines of the app's own output, replayed when the suite fails. */
const appLog = [];

function startApp() {
  console.log(`→ starting the app on ${APP_PORT}`);
  // Detached so the whole group can be signalled: killing the npx wrapper alone leaves the
  // next-server child holding the port, and the next run then aborts on the preflight check.
  const app = spawn("npx", ["next", "dev", "-p", String(APP_PORT)], {
    cwd: root,
    env: childEnv,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });

  const record = (chunk) => {
    appLog.push(...String(chunk).split("\n").filter(Boolean));
    if (appLog.length > 60) appLog.splice(0, appLog.length - 60);
  };
  app.stdout.on("data", record);
  app.stderr.on("data", record);

  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`the app did not start within ${APP_READY_TIMEOUT_MS / 1000}s`)),
      APP_READY_TIMEOUT_MS,
    );

    const watch = (chunk) => {
      const text = String(chunk);
      if (text.includes("Ready in")) {
        clearTimeout(timer);
        console.log("→ app ready");
        resolve(app);
      }
      // Surface a failed bind or a crash instead of waiting out the timeout in silence.
      if (text.includes("EADDRINUSE") || text.includes("Failed to start")) {
        clearTimeout(timer);
        reject(new Error(text.trim()));
      }
    };

    app.stdout.on("data", watch);
    app.stderr.on("data", watch);
    app.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`the app exited early with code ${code}`));
    });
  });
}

/**
 * The `Ready in` banner is not proof the port works: a second `next dev` for the same directory
 * prints the same banner and then exits, which otherwise surfaces as every request failing with
 * ECONNREFUSED instead of the one line that explains it.
 */
async function waitForApp() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (await portInUse(APP_PORT)) return;
    await sleep(250);
  }
  throw new Error(
    `nothing is listening on ${APP_PORT}. Another \`next dev\` for this directory makes this ` +
      `one exit right after its banner - stop it (\`npm run dev\`) and retry.`,
  );
}

function bru(args, label) {
  console.log(`\n──────── ${label} ────────`);
  return run("npx", ["bru", ...args], { cwd: path.join(root, "bruno"), env: childEnv }).status ?? 1;
}

async function main() {
  assertLocalDatabase();
  await preflight();
  await startDatabase();
  migrateAndSeed();

  let app;
  let failed = true;
  try {
    app = await startApp();
    await waitForApp();

    // Two invocations: the Workflow folder is an ordered walk, so it must not interleave with
    // the alphabetically-ordered folders around it.
    const suite = bru(
      [
        "run",
        "-r",
        "--env",
        "isolated",
        "--tests-only",
        "--exclude-tags",
        "Fund_slips,Payment_slips,Notifications,Workflow",
      ],
      "endpoints",
    );
    const workflow = bru(
      ["run", "Workflow", "-r", "--env", "isolated", "--tests-only"],
      "workflow walk",
    );

    failed = suite !== 0 || workflow !== 0;
  } catch (error) {
    console.error(`\n✗ ${error.message}`);
  } finally {
    if (app?.pid) {
      try {
        process.kill(-app.pid, "SIGKILL");
      } catch {
        // Already gone.
      }
    }
  }

  if (failed) {
    if (appLog.length) {
      console.error("\n──────── app output (tail) ────────");
      console.error(appLog.join("\n"));
    }
    console.error(`\n✗ suite failed. ${CONTAINER} is still running so you can inspect it:`);
    console.error(`    docker exec ${CONTAINER} psql -U postgres -c "table loan_request"`);
    console.error(`    docker rm -f ${CONTAINER}   # when you are done`);
    process.exit(1);
  }

  quiet("docker", ["rm", "-f", CONTAINER]);
  console.log("\n✓ suite passed, container removed");
}

await main();
