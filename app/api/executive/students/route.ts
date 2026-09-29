// EXPERIMENT server-paging (revert: EXPERIMENT-server-paging.local.md)
import { getStudentsPage, STUDENT_TABS, isStudentDegree, isStudentTab } from "@/db/queries/loan-requests";
import { accessError } from "@/lib/api-list";
import { apiError, apiOk } from "@/lib/api-response";
import { LIST_PARAMS_MESSAGE, parseListParams } from "@/lib/list-params";
import { getExecutiveAccess } from "@/lib/loan-auth";
import { serializeJson } from "@/lib/serialization";

export async function GET(request: Request) {
  const access = await getExecutiveAccess();
  if (access.status !== "authorized") return accessError(access, "Executive access required");

  const { searchParams } = new URL(request.url);
  const list = parseListParams(searchParams);
  const tab = searchParams.get("tab") ?? "all";
  const degree = searchParams.get("degree") ?? "";
  if (!list || !isStudentTab(tab) || (degree && !isStudentDegree(degree))) {
    return apiError("VALIDATION_ERROR", `${LIST_PARAMS_MESSAGE}; tab is one of ${STUDENT_TABS.join(", ")}; degree a known education level`, 422);
  }

  try {
    const { items, total } = await getStudentsPage("all", { tab, degree, ...list });
    return apiOk(serializeJson({ items, total, page: list.page, limit: list.limit }));
  } catch (error) {
    console.error("Unable to list students", error);
    return apiError("INTERNAL_ERROR", "Unable to list students", 500);
  }
}
