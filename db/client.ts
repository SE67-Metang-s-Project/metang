import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/db/schema";
import * as relations from "@/db/relations";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL?.replace(
    "sslmode=require",
    "sslmode=verify-full",
  ),
});

export const db = drizzle(pool, { schema: { ...schema, ...relations } });
