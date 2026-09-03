import type { UserRoleName } from "@/lib/generated/prisma/client";

export const predefinedRoleNames = [
  "student",
  "advisor",
  "admin",
  "super_admin",
  "executive",
] as const satisfies readonly UserRoleName[];

export type RoleMutationAction = "grant" | "remove";

export type RoleMutationInput = {
  action: RoleMutationAction;
  role: UserRoleName;
};

export function parseRoleMutationInput(value: unknown): RoleMutationInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("request body is invalid");
  }

  const input = value as Record<string, unknown>;
  if (input.action !== "grant" && input.action !== "remove") {
    throw new Error("action is invalid");
  }
  if (
    typeof input.role !== "string" ||
    !predefinedRoleNames.includes(input.role as UserRoleName)
  ) {
    throw new Error("role is invalid");
  }

  return { action: input.action, role: input.role as UserRoleName };
}
