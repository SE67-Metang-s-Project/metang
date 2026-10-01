/**
 * True under `next dev`, or on a deployed build with DEBUG_MODE=true (a deployed build is always
 * NODE_ENV=production). Infisical only shares env values; INFISICAL_ENV plays no part here.
 */
export function isDevelopmentEnvironment(
  nodeEnvironment = process.env.NODE_ENV,
  debugMode = process.env.DEBUG_MODE,
) {
  return nodeEnvironment === "development" || debugMode === "true";
}

export function isDevelopmentApiAccess(
  bypass = process.env.DEV_API_BYPASS,
  nodeEnvironment = process.env.NODE_ENV,
) {
  return isDevelopmentApiBypass(bypass, nodeEnvironment);
}

export function isDevelopmentApiBypass(
  bypass = process.env.DEV_API_BYPASS,
  nodeEnvironment = process.env.NODE_ENV,
) {
  return bypass === "true" && isDevelopmentEnvironment(nodeEnvironment);
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
  nodeEnvironment = process.env.NODE_ENV,
) {
  return value === "true" && isDevelopmentEnvironment(nodeEnvironment);
}

const developmentRoleUserIdEnvironmentVariables: Record<DevelopmentApiRole, string> = {
  advisor: "DEV_ADVISOR_USER_ID",
  admin: "DEV_ADMIN_USER_ID",
  super_admin: "DEV_SUPERADMIN_USER_ID",
  executive: "DEV_EXECUTIVE_USER_ID",
};

/**
 * Overrides which seeded user a single role's dev bypass resolves to - unlike a blanket
 * override, this only affects that one role's lookup, so a fixture that legitimately holds more
 * than one role (e.g. exec@cmu.ac.th also holding "advisor") can be reached through the advisor
 * bypass without disturbing the admin/super_admin/executive bypasses' own default fixtures.
 * Unset, each role resolves to its usual fixed fixture (unchanged behavior).
 */
export function getDevelopmentRoleUserId(
  role: DevelopmentApiRole,
  value = process.env[developmentRoleUserIdEnvironmentVariables[role]],
  nodeEnvironment = process.env.NODE_ENV,
): string | undefined {
  if (!isDevelopmentEnvironment(nodeEnvironment)) return undefined;
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
