import { type NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api-response";
import { getSuperAdminAccess } from "@/lib/loan-auth";
import { getExecutiveFinancialOverviewData } from "@/db/queries/financial-overview";

/** Financial summary and activity for the Super Admin dashboard. */
export async function GET(request: NextRequest) {
  const access = await getSuperAdminAccess();
  if (access.status === "unauthenticated") {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }
  if (access.status === "forbidden") {
    return apiError("FORBIDDEN", "Super Admin access required", 403);
  }

  let targetYear: number | undefined;
  const rawYear = request.nextUrl.searchParams.get("year");
  if (rawYear) {
    const parsed = parseInt(rawYear, 10);
    if (!Number.isNaN(parsed)) {
      const gregorianYear = parsed > 2400 ? parsed - 543 : parsed;
      targetYear = Math.min(gregorianYear, new Date().getFullYear());
    }
  }

  // A failure is a 500, not an all-zero overview: zeros would read as an empty fund.
  try {
    return apiOk(await getExecutiveFinancialOverviewData(targetYear));
  } catch (error) {
    console.error("Unable to load financial overview from DB for SuperAdmin", error);
    return apiError("INTERNAL_ERROR", "Unable to load the financial overview", 500);
  }
}
