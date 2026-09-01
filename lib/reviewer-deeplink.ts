export type ReviewerRole = "advisor" | "admin" | "super_admin" | "executive";

/**
 * Stable route contract between notification delivery and reviewer-facing pages.
 * Frontend routes can be added later without changing the worker or FON payload shape.
 */
export const REVIEWER_REQUEST_PATHS: Readonly<Record<ReviewerRole, string>> = {
  advisor: "/advisor/pending/requests",
  admin: "/admin/requests",
  super_admin: "/admin/requests",
  executive: "/executive/requests",
};

function validateRequestId(requestId: string) {
  if (!requestId.trim()) {
    throw new Error("requestId is required to build a reviewer deep link");
  }
}

function validateBaseUrl(baseUrl: string) {
  let url: URL;

  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error("APP_BASE_URL must be a valid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("APP_BASE_URL must use HTTP or HTTPS");
  }
}

export function buildReviewerRequestPath(role: ReviewerRole, requestId: string) {
  validateRequestId(requestId);

  return `${REVIEWER_REQUEST_PATHS[role]}/${encodeURIComponent(requestId)}`;
}

export function buildReviewerRequestUrl(
  baseUrl: string,
  role: ReviewerRole,
  requestId: string,
) {
  validateBaseUrl(baseUrl);

  return new URL(buildReviewerRequestPath(role, requestId), baseUrl).toString();
}
