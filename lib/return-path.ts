// Pure helpers for "return to the original page after sign-in". No server-only imports, so the
// validator can be unit-tested directly and shared by the proxy, the page guard and the callback.

// Request header that proxy.ts sets to the current pathname + search for the page guards.
export const RETURN_PATH_HEADER = "x-metang-return-path";

const MAX_RETURN_PATH_LENGTH = 2048;
const BASE_ORIGIN = "http://localhost";
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;

function isBlockedPathname(pathname: string) {
  const lowerPathname = pathname.toLowerCase();

  return ["/api", "/login"].some(
    (prefix) => lowerPathname === prefix || lowerPathname.startsWith(`${prefix}/`),
  );
}

/**
 * Returns a same-site relative path (pathname + search) that is safe to redirect to, or null.
 * The raw-string checks run before `new URL`, because the URL parser silently strips tabs and
 * newlines and turns backslashes into slashes.
 */
export function sanitizeReturnPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length > MAX_RETURN_PATH_LENGTH) {
    return null;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  if (value.includes("\\") || CONTROL_CHARACTERS.test(value)) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(value, BASE_ORIGIN);
  } catch {
    return null;
  }

  if (url.origin !== BASE_ORIGIN) {
    return null;
  }

  let decodedPathname: string;
  try {
    decodedPathname = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }

  // Checked on the resolved pathname, so "/x/../api" and "/%2e%2e/login" are caught too.
  if (isBlockedPathname(url.pathname) || isBlockedPathname(decodedPathname)) {
    return null;
  }

  const returnPath = `${url.pathname}${url.search}`;

  return returnPath.length > MAX_RETURN_PATH_LENGTH ? null : returnPath;
}
