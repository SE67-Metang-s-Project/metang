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

export function buildStudentLoanDetailUrl(baseUrl: string): string {
  validateBaseUrl(baseUrl);

  return new URL(STUDENT_LOAN_DETAIL_PATH, baseUrl).toString();
}
