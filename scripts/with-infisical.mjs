import { spawnSync } from "node:child_process";
import dotenv from "dotenv";

const dotenvResult = dotenv.config({ quiet: true });

if (dotenvResult.error?.code === "ENOENT") {
  throw new Error("Missing .env. Create it from .env.example and set INFISICAL_ENV.");
}

if (dotenvResult.error) {
  throw dotenvResult.error;
}

const environment = dotenvResult.parsed?.INFISICAL_ENV || "dev";

if (!environment) {
  throw new Error("Missing INFISICAL_ENV in .env. Set it to the Infisical environment to use.");
}

const [command, ...args] = process.argv.slice(2);

if (!command) {
  throw new Error("Usage: node scripts/with-infisical.mjs <command> [...args]");
}

const run = (executable, executableArgs) =>
  spawnSync(executable, executableArgs, { env: process.env, stdio: "inherit" });

const result = run("infisical", [
  "run",
  "--env",
  environment,
  "--",
  command,
  ...args,
]);

if (result.error?.code === "ENOENT") {
  process.exit(run(command, args).status ?? 1);
}

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
