import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const readOperations = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "findUnique",
  "findUniqueOrThrow",
]);

const createPrismaClient = () => {
  const base = new PrismaClient({
    // A cold connection to the Supabase pooler costs ~1.3s (DNS + TCP + TLS + SASL to Singapore),
    // so keep idle ones for 5 minutes rather than reconnecting after a short pause. If the pooler
    // drops an idle connection first, the adapter's pool "error" listener absorbs it and pg-pool
    // discards the client - the next query just reconnects, as it would after a timeout.
    adapter: new PrismaPg({ connectionString, idleTimeoutMillis: 300_000 }),
    transactionOptions: { maxWait: 10_000 },
  });

  return base.$extends({
    query: {
      $allModels: {
        $allOperations({ args, operation, query }) {
          if (readOperations.has(operation) && args && typeof args === "object") {
            const readArgs = args as { relationLoadStrategy?: "join" | "query" };
            readArgs.relationLoadStrategy ??= "join";
          }

          return query(args);
        },
      },
    },
  });
};

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createPrismaClient> };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
