import { execFileSync } from "node:child_process";

process.loadEnvFile(".env");

const file = process.argv[2];
if (!file) throw new Error("usage: node db/run-sql.mjs <file.sql>");

execFileSync("psql", [process.env.DATABASE_URL, "-v", "ON_ERROR_STOP=1", "-f", file], {
  stdio: "inherit",
});
