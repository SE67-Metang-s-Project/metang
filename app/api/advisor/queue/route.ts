// EXPERIMENT server-paging (revert: EXPERIMENT-server-paging.local.md)
import { getAdvisorQueuePage } from "@/db/queries/loan-requests";
import { accessError } from "@/lib/api-list";
import { apiError, apiOk } from "@/lib/api-response";
import { LIST_PARAMS_MESSAGE, parseListParams } from "@/lib/list-params";
import { getAdvisorAccess } from "@/lib/loan-auth";
import { QUEUE_FILTERS, isQueueFilter } from "@/lib/queue-filter";
import { serializeJson } from "@/lib/serialization";

export async function GET(request: Request) {
  const access = await getAdvisorAccess();
  if (access.status !== "authorized") return accessError(access, "Advisor access required");

  const { searchParams } = new URL(request.url);
  const list = parseListParams(searchParams);
  const filter = searchParams.get("filter") ?? "all";
  if (!list || !isQueueFilter(filter)) {
    return apiError("VALIDATION_ERROR", `${LIST_PARAMS_MESSAGE}; filter is one of ${QUEUE_FILTERS.join(", ")}`, 422);
  }

  try {
    const { items, total, counts } = await getAdvisorQueuePage(access.context.user.id, { filter, ...list });
    return apiOk(serializeJson({ items, total, counts, page: list.page, limit: list.limit }));
  } catch (error) {
    console.error("Unable to list advisor queue", error);
    return apiError("INTERNAL_ERROR", "Unable to list advisor queue", 500);
  }
}
