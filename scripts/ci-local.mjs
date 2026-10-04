// Runs the checks of .github/workflows/ci.yml in the same order and stops at the first failure.
// When it is done, pass or fail, it deletes what the run leaves behind: the build output in `.next`
// (not `.next/dev`) and the `metang-test` container that a failed `npm run api:test` keeps.
// `npm ci` is opt-in (`npm run ci:local -- --install`) because it deletes node_modules first.
// Needs Docker for the last step. Stop any `next dev` or `next start` of this folder first: it
// refuses to run while one is listening (ports 8080, 3000 and $PORT) or while `.next/dev/lock`
// names a live dev server.
// `--summary` (`npm run ci:local-summarize`) hides the step output and prints one table of the
// numbers at the end; the full output goes to $TMPDIR/metang-ci-local.log.
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createConnection } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// The build only needs the variables to exist, it never connects (same placeholders as CI).
const buildEnv = {
  DATABASE_URL: "postgresql://ci:ci@localhost:5432/ci",
  DIRECT_URL: "postgresql://ci:ci@localhost:5432/ci",
};

// Summary parsers: each reads one step's output (ANSI codes stripped) and returns its numbers.
const count = (text, pattern) => text.match(pattern)?.[1];
const parseLint = (text) => {
  const problems = text.match(/(\d+) errors?, (\d+) warnings?/);
  return problems ? `${problems[1]} errors, ${problems[2]} warnings` : "0 errors, 0 warnings";
};
const parseTsc = (text) => `${(text.match(/error TS\d+/g) ?? []).length} errors`;
const parseUnit = (text) => {
  const [, line, branch, funcs] = text.match(/all files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/) ?? [];
  const tests = `${count(text, /ℹ pass (\d+)/) ?? "?"}/${count(text, /ℹ tests (\d+)/) ?? "?"} pass`;
  return branch ? `${tests}, branch ${branch}% (line ${line}%, funcs ${funcs}%)` : tests;
};
const parseApi = (text) => {
  const db = `db ${count(text, /ℹ pass (\d+)/) ?? "?"}/${count(text, /ℹ tests (\d+)/) ?? "?"}`;
  const requests = [...text.matchAll(/│ Requests\s*│\s*(\d+) \(([^)]*)\)/g)];
  const assertions = [...text.matchAll(/│ Assertions\s*│\s*(\d+\/\d+)/g)];
  const bruno = ["endpoints", "workflow"].map((label, index) =>
    requests[index]
      ? `${label} ${requests[index][1]} req (${requests[index][2]}), ${assertions[index]?.[1] ?? "?"} assertions`
      : `${label} not run`,
  );
  return [db, ...bruno].join(" · ");
};

const steps = [
  ...(process.argv.includes("--install") ? [{ name: "install", command: "npm ci" }] : []),
  { name: "lint", command: "npm run lint", parse: parseLint },
  { name: "typecheck", command: "npx tsc --noEmit", parse: parseTsc },
  { name: "build", command: "npm run build", env: buildEnv },
  // The unit tests, plus a branch-coverage floor of 80% (lib/generated and tests/ left out).
  { name: "unit + coverage", command: "npm run test:coverage", parse: parseUnit },
  { name: "api:test", command: "npm run api:test", parse: parseApi },
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
  if (!summary) console.log("\ncleanup: deleted the build output in .next and the metang-test container");
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
const summary = process.argv.includes("--summary");
const logPath = path.join(tmpdir(), "metang-ci-local.log");
const rows = [];
if (summary) writeFileSync(logPath, "");

for (const { name, command, env, parse } of steps) {
  const started = Date.now();
  if (summary) process.stdout.write(`▶ ${name}…\n`);
  else console.log(`\n▶ ${command}`);
  const result = spawnSync(summary ? `${command} 2>&1` : command, {
    cwd: root,
    stdio: summary ? ["ignore", "pipe", "inherit"] : "inherit",
    shell: true,
    env: { ...process.env, ...env },
    maxBuffer: 256 * 1024 * 1024,
  });
  const seconds = `${Math.round((Date.now() - started) / 1000)}s`;
  const ok = result.status === 0;
  if (summary) {
    const output = (result.stdout?.toString() ?? "").replace(/\x1b\[[0-9;]*m/g, "");
    appendFileSync(logPath, `\n▶ ${command}\n${output}`);
    rows.push([ok ? "✓" : "✗", name, parse ? parse(output) : ok ? "ok" : "failed", seconds]);
  }
  if (!ok) {
    if (!summary) console.error(`\n✗ ${command} failed`);
    exitCode = result.status ?? 1;
    break;
  }
}

cleanup();
if (summary) {
  for (const { name } of steps.slice(rows.length)) rows.push(["–", name, "skipped", ""]);
  const width = Math.max(...rows.map((row) => row[1].length));
  console.log("");
  for (const [mark, name, numbers, seconds] of rows) {
    console.log(`${mark} ${name.padEnd(width)}  ${seconds.padStart(5)}  ${numbers}`);
  }
  console.log(`\nfull log: ${logPath}`);
}
if (exitCode === 0) console.log("✓ all CI checks passed");
process.exit(exitCode);
