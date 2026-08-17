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
  return bypass === "true" && isDevelopmentEnvironment(infisicalEnvironment, nodeEnvironment);
}
