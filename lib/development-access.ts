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
