import type { UserRoleName } from "@/lib/generated/prisma/client";

export const predefinedRoleNames = [
  "student",
  "advisor",
  "admin",
  "super_admin",
  "executive",
] as const satisfies readonly UserRoleName[];

export type RoleMutationAction = "grant" | "remove";

export function holdsAdminAccess(roles: readonly UserRoleName[]) {
  return roles.includes("admin") || roles.includes("super_admin");
}

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

/**
 * True for an address at cmu.ac.th, the only domain the email API sends to. People sign in with a
 * CMU account and the account name is the part before "@", so an address elsewhere cannot belong
 * to a CMU user.
 */
export function isCmuEmail(email: string) {
  return /^[^\s@]+@cmu\.ac\.th$/i.test(email.trim());
}
