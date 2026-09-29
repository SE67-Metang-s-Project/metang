// EXPERIMENT server-paging (revert: EXPERIMENT-server-paging.local.md)
import { getVerifySlipPage } from "@/db/queries/loan-requests";
import { accessError } from "@/lib/api-list";
import { apiError, apiOk } from "@/lib/api-response";
import { LIST_PARAMS_MESSAGE, parseListParams } from "@/lib/list-params";
import { getAdminAccess } from "@/lib/loan-auth";
import { serializeJson } from "@/lib/serialization";

// Admin and SuperAdmin share this: getAdminAccess admits both.
export async function GET(request: Request) {
  const access = await getAdminAccess();
  if (access.status !== "authorized") return accessError(access, "Admin access required");

  const list = parseListParams(new URL(request.url).searchParams);
  if (!list) return apiError("VALIDATION_ERROR", LIST_PARAMS_MESSAGE, 422);

  try {
    const { items, total } = await getVerifySlipPage(list);
    return apiOk(serializeJson({ items, total, page: list.page, limit: list.limit }));
  } catch (error) {
    console.error("Unable to list verify-slip requests", error);
    return apiError("INTERNAL_ERROR", "Unable to list verify-slip requests", 500);
  }
}
