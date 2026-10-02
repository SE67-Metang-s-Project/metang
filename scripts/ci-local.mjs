// Runs the checks of .github/workflows/ci.yml in the same order and stops at the first failure.
// When it is done, pass or fail, it deletes what the run leaves behind: the build output in `.next`
// (not `.next/dev`) and the `metang-test` container that a failed `npm run api:test` keeps.
// `npm ci` is opt-in (`npm run ci:local -- --install`) because it deletes node_modules first.
// Needs Docker for the last step. Stop any `next dev` or `next start` of this folder first: it
// refuses to run while one is listening (ports 8080, 3000 and $PORT) or while `.next/dev/lock`
// names a live dev server.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { createConnection } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// The build only needs the variables to exist, it never connects (same placeholders as CI).
const buildEnv = {
  DATABASE_URL: "postgresql://ci:ci@localhost:5432/ci",
  DIRECT_URL: "postgresql://ci:ci@localhost:5432/ci",
};

const steps = [
  ...(process.argv.includes("--install") ? [{ command: "npm ci" }] : []),
  { command: "npm run lint" },
  { command: "npx tsc --noEmit" },
  { command: "npm run build", env: buildEnv },
  { command: "npm test" },
  { command: "npm run api:test" },
];

// `.next/dev` is the dev server's own folder, so a `npm run dev` that is running keeps working.
function cleanup() {
  const next = path.join(root, ".next");
  if (existsSync(next)) {
    for (const entry of readdirSync(next)) {
      if (entry !== "dev") rmSync(path.join(next, entry), { recursive: true, force: true });
    }
  }
  spawnSync("docker", ["rm", "-f", "metang-test"], { stdio: "ignore" });
  console.log("\ncleanup: deleted the build output in .next and the metang-test container");
}

// The build rewrites `.next` and the cleanup deletes it, which breaks a `next dev` or `next start`
// that is still serving from it. `npm run dev`, `npm run dev-normal` and `npm run start:infisical`
// listen on 8080; a plain `npm run start` listens on $PORT, or on 3000 when that is not set.
const serverPorts = [...new Set([8080, 3000, Number(process.env.PORT)].filter(Boolean))];

const portInUse = (port) =>
  new Promise((resolve) => {
    const socket = createConnection({ port, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });

// `.next/dev/lock` holds the pid of a `next dev`, whatever port it uses (the same check as
// scripts/api-test-isolated.mjs).
function runningDevServer() {
  try {
    const lock = JSON.parse(readFileSync(path.join(root, ".next/dev/lock"), "utf8"));
    if (!lock?.pid) return null;
    process.kill(lock.pid, 0); // signal 0 tests that the process is alive and does nothing else
    return lock;
  } catch {
    return null; // no lock, an unreadable lock, or a stale lock of a process that is gone
  }
}

const busyPorts = [];
for (const port of serverPorts) if (await portInUse(port)) busyPorts.push(port);
const devServer = runningDevServer();
if (busyPorts.length > 0 || devServer) {
  console.error("✗ a Next server of this folder may be running:");
  if (devServer) {
    console.error(`  next dev, pid ${devServer.pid} (${devServer.appUrl ?? "unknown url"})`);
  }
  for (const port of busyPorts) console.error(`  something is listening on port ${port}`);
  console.error("  This run rebuilds and deletes .next, which breaks it. Stop it and retry.");
  console.error("  If that port belongs to another program, free it or run the checks by hand.");
  process.exit(1);
}

let exitCode = 0;
for (const { command, env } of steps) {
  console.log(`\n▶ ${command}`);
  const result = spawnSync(command, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    console.error(`\n✗ ${command} failed`);
    exitCode = result.status ?? 1;
    break;
  }
}

cleanup();
if (exitCode === 0) console.log("✓ all CI checks passed");
process.exit(exitCode);
