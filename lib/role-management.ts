import type { UserRoleName } from "@/lib/generated/prisma/client";

// No "student": students are not app_user rows, so there is nobody to grant it to.
export const predefinedRoleNames = [
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
    !(predefinedRoleNames as readonly string[]).includes(input.role)
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

/** Longest Thai or English name the staff forms accept; a full academic title fits well inside. */
export const MAX_NAME_LENGTH = 200;

/** True when either name, after trimming, is longer than MAX_NAME_LENGTH. A missing name is not too long. */
export function isNameTooLong(fullNameTh: string, fullNameEn: unknown) {
  return [fullNameTh, fullNameEn].some((name) => typeof name === "string" && name.trim().length > MAX_NAME_LENGTH);
}
