// The app is served under this prefix (next.config.ts `basePath`). Next.js adds it to <Link>,
// router, and redirect() paths, but not to fetch(), new URL(), or response Location headers.
//
// PUBLIC_SUBPATH sets it at build time. next.config.ts passes the resolved value to `env`, so
// Next.js writes it into both the server and the browser bundles: changing it needs a rebuild,
// and the server must start with the same value. Unset keeps "/metang"; "" or "/" serves from the root.

/**
 * Returns the base path for a PUBLIC_SUBPATH value. Next.js needs a leading "/" and no trailing
 * "/", and people type "loan" or "/loan/", so those are tidied. "" and "/" both mean the root.
 */
export function resolveBasePath(value: string | undefined): string {
  if (value === undefined) return "/metang";
  const trimmed = value.trim().replace(/^\/+|\/+$/g, "");
  return trimmed && `/${trimmed}`;
}

export const BASE_PATH = resolveBasePath(process.env.PUBLIC_SUBPATH);

/** Prefixes an app-root path such as "/api/student/payments" with the base path. */
export function withBasePath(path: string): string {
  if (!path.startsWith("/")) throw new Error(`withBasePath expects a path starting with "/": ${path}`);
  if (path === BASE_PATH || path.startsWith(`${BASE_PATH}/`)) return path;
  return `${BASE_PATH}${path}`;
}
