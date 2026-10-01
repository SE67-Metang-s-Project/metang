// A real build runs with NODE_ENV=production. `next dev` and the tests do not, and count as dev.
// These read the variable on each call, so a test can change it. Do not use INFISICAL_ENV for this:
// it only says which shared secrets a developer loaded.
export const isProd = () => process.env.NODE_ENV === "production";
// The sign-in rule: a production build lets in only nursing students and nursing staff, unless
// DEBUG_MODE=true opens sign-in to any CMU account (a debug deployment on fake data).
export const isNurseOnly = () => isProd() && process.env.DEBUG_MODE !== "true";
