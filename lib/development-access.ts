export function isDevelopmentEnvironment(
  infisicalEnvironment = process.env.INFISICAL_ENV,
  nodeEnvironment = process.env.NODE_ENV,
) {
  return infisicalEnvironment === "dev" && nodeEnvironment === "development";
}

export function isDevelopmentApiAccess(
  bypass = process.env.DEV_API_BYPASS,
  infisicalEnvironment = process.env.INFISICAL_ENV,
  nodeEnvironment = process.env.NODE_ENV,
) {
  return isDevelopmentApiBypass(bypass, infisicalEnvironment, nodeEnvironment);
}

export function isDevelopmentApiBypass(
  bypass = process.env.DEV_API_BYPASS,
  infisicalEnvironment = process.env.INFISICAL_ENV,
  nodeEnvironment = process.env.NODE_ENV,
) {
  return bypass === "true" && isDevelopmentEnvironment(infisicalEnvironment, nodeEnvironment);
}

export type DevelopmentApiRole = "advisor" | "admin" | "super_admin" | "executive";

const developmentRoleEnvironmentVariables: Record<DevelopmentApiRole, string> = {
  advisor: "DEV_AS_ADVISOR",
  admin: "DEV_AS_ADMIN",
  super_admin: "DEV_AS_SUPERADMIN",
  executive: "DEV_AS_EXECUTIVE",
};

export function isDevelopmentRoleEnabled(
  role: DevelopmentApiRole,
  value = process.env[developmentRoleEnvironmentVariables[role]],
  infisicalEnvironment = process.env.INFISICAL_ENV,
  nodeEnvironment = process.env.NODE_ENV,
) {
  return value === "true" && isDevelopmentEnvironment(infisicalEnvironment, nodeEnvironment);
}

/**
 * Overrides which seeded user a role-scoped dev bypass resolves to. Without this, each role
 * always maps to its own fixed fixture (e.g. the advisor bypass always resolves to
 * advisor@cmu.ac.th), so a fixture that legitimately holds more than one role (e.g.
 * exec@cmu.ac.th also holding "advisor") can never be reached through the advisor bypass. Set
 * DEV_ACTIVE_USER_ID to that user's id to test as them under any role they actually hold.
 */
export function getDevelopmentActiveUserId(
  value = process.env.DEV_ACTIVE_USER_ID,
  infisicalEnvironment = process.env.INFISICAL_ENV,
  nodeEnvironment = process.env.NODE_ENV,
): string | undefined {
  if (!isDevelopmentEnvironment(infisicalEnvironment, nodeEnvironment)) return undefined;
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
