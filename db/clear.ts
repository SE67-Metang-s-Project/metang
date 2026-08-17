import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const environment = process.env.INFISICAL_ENV?.trim() || "dev";

if (environment !== "dev") {
  throw new Error("db:clear is only allowed with INFISICAL_ENV=dev");
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  await prisma.$executeRaw`
    TRUNCATE TABLE
      "public"."payment",
      "public"."installment",
      "public"."loan_approval",
      "public"."fund_transaction",
      "public"."audit_log",
      "public"."user_role",
      "public"."loan_request",
      "public"."app_user"
    RESTART IDENTITY CASCADE
  `;

  console.log("Development database cleared.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
