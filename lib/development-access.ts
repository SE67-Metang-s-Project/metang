/**
 * True under `next dev`, or on a deployed build with DEBUG_MODE=true (a deployed build is always
 * NODE_ENV=production). Infisical only shares env values; INFISICAL_ENV plays no part here.
 */
export function isDevelopmentEnvironment(
  nodeEnvironment: string | undefined = process.env.NODE_ENV,
  debugMode = process.env.DEBUG_MODE,
) {
  return nodeEnvironment === "development" || debugMode === "true";
}

export function isDevelopmentApiAccess(
  bypass = process.env.DEV_API_BYPASS,
  nodeEnvironment: string | undefined = process.env.NODE_ENV,
  debugMode = process.env.DEBUG_MODE,
) {
  return isDevelopmentApiBypass(bypass, nodeEnvironment, debugMode);
}

export function isDevelopmentApiBypass(
  bypass = process.env.DEV_API_BYPASS,
  nodeEnvironment: string | undefined = process.env.NODE_ENV,
  debugMode = process.env.DEBUG_MODE,
) {
  return bypass === "true" && isDevelopmentEnvironment(nodeEnvironment, debugMode);
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
  nodeEnvironment: string | undefined = process.env.NODE_ENV,
  debugMode = process.env.DEBUG_MODE,
) {
  return value === "true" && isDevelopmentEnvironment(nodeEnvironment, debugMode);
}

/**
 * The page a dev shortcut sends a sign-in to: the highest enabled DEV_AS_* role, else the student
 * page when only DEV_API_BYPASS is on, else null. The caller uses it only for an account that
 * holds no role of its own.
 */
export function getDevelopmentHomePath(
  env: Record<string, string | undefined> = process.env,
): string | null {
  const homePaths: [DevelopmentApiRole, string][] = [
    ["super_admin", "/superadmin"],
    ["executive", "/executive"],
    ["admin", "/admin"],
    ["advisor", "/advisor"],
  ];
  for (const [role, path] of homePaths) {
    const value = env[developmentRoleEnvironmentVariables[role]];
    if (isDevelopmentRoleEnabled(role, value, env.NODE_ENV, env.DEBUG_MODE)) return path;
  }
  return isDevelopmentApiBypass(env.DEV_API_BYPASS, env.NODE_ENV, env.DEBUG_MODE)
    ? "/student"
    : null;
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
  nodeEnvironment: string | undefined = process.env.NODE_ENV,
  debugMode = process.env.DEBUG_MODE,
): string | undefined {
  if (!isDevelopmentEnvironment(nodeEnvironment, debugMode)) return undefined;
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
