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
    adapter: new PrismaPg({ connectionString, idleTimeoutMillis: 60_000 }),
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
