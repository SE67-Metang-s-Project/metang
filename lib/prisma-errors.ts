import { Prisma } from "@/lib/generated/prisma/client";

export function isUniqueConstraintOnField(
  error: unknown,
  field: string,
): error is Prisma.PrismaClientKnownRequestError {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  const target = error.meta?.target;
  return Array.isArray(target) ? target.includes(field) : target === field;
}