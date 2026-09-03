import { getMockExecutiveFinancialOverview } from "@/lib/mock-data/executive-financial-overview";
import { apiError, apiOk } from "@/lib/api-response";
import { getExecutiveAccess } from "@/lib/loan-auth";

/** Mock financial summary and activity for the executive dashboard. */
export async function GET() {
  const access = await getExecutiveAccess();
  if (access.status === "unauthenticated") return apiError("UNAUTHORIZED", "Authentication required", 401);
  if (access.status === "forbidden") return apiError("FORBIDDEN", "Executive access required", 403);

  return apiOk(getMockExecutiveFinancialOverview());
}
