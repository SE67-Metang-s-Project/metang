// EXPERIMENT server-paging (revert: EXPERIMENT-server-paging.local.md)
import { getDisbursementPage, isDisbursementTab } from "@/db/queries/loan-requests";
import { accessError } from "@/lib/api-list";
import { apiError, apiOk } from "@/lib/api-response";
import { LIST_PARAMS_MESSAGE, MAX_TEXT_LENGTH, parseListParams } from "@/lib/list-params";
import { getAdminAccess } from "@/lib/loan-auth";
import { serializeJson } from "@/lib/serialization";

// Admin and SuperAdmin share this: getAdminAccess admits both.
export async function GET(request: Request) {
  const access = await getAdminAccess();
  if (access.status !== "authorized") return accessError(access, "Admin access required");

  const { searchParams } = new URL(request.url);
  const list = parseListParams(searchParams);
  const tab = searchParams.get("tab") ?? "all";
  const degree = searchParams.get("degree") ?? "";
  if (!list || !isDisbursementTab(tab) || degree.length > MAX_TEXT_LENGTH) {
    return apiError("VALIDATION_ERROR", `${LIST_PARAMS_MESSAGE}; tab is one of all, pending, done`, 422);
  }

  try {
    const { items, total } = await getDisbursementPage({ tab, degree, ...list });
    return apiOk(serializeJson({ items, total, page: list.page, limit: list.limit }));
  } catch (error) {
    console.error("Unable to list disbursement requests", error);
    return apiError("INTERNAL_ERROR", "Unable to list disbursement requests", 500);
  }
}
