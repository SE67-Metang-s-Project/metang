import { Prisma } from "@/lib/generated/prisma/client";

export function isUniqueConstraintOnField(
  error: unknown,
  field: string,
): error is Prisma.PrismaClientKnownRequestError {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  const target = error.meta?.target;
  if (Array.isArray(target)) return target.includes(field);
  if (typeof target === "string") return target === field;
  const fields = /Unique constraint failed on the fields?: \(([^)]*)\)/.exec(error.message)?.[1];
  return fields
    ? fields.split(",").some((name) => name.trim().replace(/^`|`$/g, "") === field)
    : false;
}