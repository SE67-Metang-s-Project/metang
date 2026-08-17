import { apiError } from "@/lib/api-response";

export function isSameOrigin(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");

  if (origin) {
    try {
      return new URL(origin).origin === requestOrigin;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin === requestOrigin;
    } catch {
      return false;
    }
  }

  return true;
}

export function isJsonRequest(request: Request) {
  return (
    request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() ===
    "application/json"
  );
}

export function validateJsonRequest(request: Request) {
  if (!isSameOrigin(request) || !isJsonRequest(request)) {
    return apiError("FORBIDDEN", "A same-origin JSON request is required", 403);
  }

  return null;
}
