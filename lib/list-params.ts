// EXPERIMENT server-paging (revert: EXPERIMENT-server-paging.local.md)
// Shared query-string parsing for the paged list endpoints under /api/<role>/.

export const DEFAULT_PAGE_SIZE = 5;
export const MAX_PAGE_SIZE = 50;
export const MAX_TEXT_LENGTH = 100;

const positiveInt = (value: string | null, fallback: number, max: number) => {
  if (value === null) return fallback;
  return /^\d+$/.test(value) && Number(value) >= 1 ? Math.min(Number(value), max) : null;
};

/** page, limit (capped) and free-text q, or null when any of them is malformed. */
export function parseListParams(searchParams: URLSearchParams) {
  const page = positiveInt(searchParams.get("page"), 1, Number.MAX_SAFE_INTEGER);
  const limit = positiveInt(searchParams.get("limit"), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const q = searchParams.get("q") ?? "";
  if (page === null || limit === null || q.length > MAX_TEXT_LENGTH) return null;
  return { page, limit, q };
}

export const LIST_PARAMS_MESSAGE =
  "page and limit must be positive integers, and q at most 100 characters";
