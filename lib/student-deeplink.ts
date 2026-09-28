import { withBasePath } from "@/lib/base-path";

// App-root page path; the link adds the base path.
export const STUDENT_LOAN_DETAIL_PATH = "/student/detail";

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

/** With a requestId, the link opens that loan (`/student/detail?request=<id>`) rather than the
 *  student's current one - a notice about a closed or rejected loan must not land elsewhere.
 *  The link is the origin of baseUrl, the base path, then the page path; a path in baseUrl is
 *  not used. */
export function buildStudentLoanDetailUrl(baseUrl: string, requestId?: string): string {
  validateBaseUrl(baseUrl);

  const url = new URL(withBasePath(STUDENT_LOAN_DETAIL_PATH), baseUrl);
  if (requestId) url.searchParams.set("request", requestId);
  return url.toString();
}
