// The origin the browser used to reach the app. Behind a reverse proxy Next.js builds request.url
// from its own listen address (it reads only X-Forwarded-Proto), so request.url would give
// "https://127.0.0.1:3000". The proxy must pass the public host in X-Forwarded-Host or Host.
// Safe to trust: a cross-site page cannot set these headers in the victim's browser.
export function getPublicOrigin(request: Request): string {
  const first = (name: string) => request.headers.get(name)?.split(",")[0].trim();
  const requestUrl = new URL(request.url);
  const host = first("x-forwarded-host") || first("host");
  const proto = first("x-forwarded-proto") || requestUrl.protocol.slice(0, -1);

  try {
    // Through URL, so a default port is dropped exactly as the browser's Origin header does.
    return host ? new URL(`${proto}://${host}`).origin : requestUrl.origin;
  } catch {
    return requestUrl.origin;
  }
}
