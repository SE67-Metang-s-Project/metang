// The app is served under this prefix (next.config.ts `basePath`). Next.js adds it to <Link>,
// router, and redirect() paths, but not to fetch(), new URL(), or response Location headers.
export const BASE_PATH = "/metang";

/** Prefixes an app-root path such as "/api/student/payments" with the base path. */
export function withBasePath(path: string): string {
  if (!path.startsWith("/")) throw new Error(`withBasePath expects a path starting with "/": ${path}`);
  if (path === BASE_PATH || path.startsWith(`${BASE_PATH}/`)) return path;
  return `${BASE_PATH}${path}`;
}
