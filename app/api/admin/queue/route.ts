// EXPERIMENT server-paging (revert: EXPERIMENT-server-paging.local.md)
import { getAdminQueuePage } from "@/db/queries/loan-requests";
import { accessError } from "@/lib/api-list";
import { apiError, apiOk } from "@/lib/api-response";
import { LIST_PARAMS_MESSAGE, parseListParams } from "@/lib/list-params";
import { getAdminAccess } from "@/lib/loan-auth";
import { QUEUE_FILTERS, isQueueFilter } from "@/lib/queue-filter";
import { serializeJson } from "@/lib/serialization";

// Admin and SuperAdmin share this: getAdminAccess admits both. Another admin's pending_admin loan is
// hidden through the viewer id, as on the page.
export async function GET(request: Request) {
  const access = await getAdminAccess();
  if (access.status !== "authorized") return accessError(access, "Admin access required");

  const { searchParams } = new URL(request.url);
  const list = parseListParams(searchParams);
  const filter = searchParams.get("filter") ?? "all";
  if (!list || !isQueueFilter(filter)) {
    return apiError("VALIDATION_ERROR", `${LIST_PARAMS_MESSAGE}; filter is one of ${QUEUE_FILTERS.join(", ")}`, 422);
  }

  try {
    const { items, total, counts } = await getAdminQueuePage(access.context.user.id, { filter, ...list });
    return apiOk(serializeJson({ items, total, counts, page: list.page, limit: list.limit }));
  } catch (error) {
    console.error("Unable to list admin queue", error);
    return apiError("INTERNAL_ERROR", "Unable to list admin queue", 500);
  }
}
