import { NextResponse, type NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api-response";
import { getExecutiveAccess } from "@/lib/loan-auth";
import {
  getExecutiveFinancialOverviewData,
  getZeroFinancialOverview,
} from "@/db/queries/financial-overview";

/** Financial summary and activity for the executive dashboard. */
export async function GET(request: NextRequest) {
  try {
    const access = await getExecutiveAccess();
    if (access.status === "unauthenticated") {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }
    if (access.status === "forbidden") {
      return apiError("FORBIDDEN", "Executive access required", 403);
    }

    const rawYear = request.nextUrl.searchParams.get("year");
    let targetYear: number | undefined;

    if (rawYear) {
      const parsed = parseInt(rawYear, 10);
      if (!Number.isNaN(parsed)) {
        // Normalize Buddhist year (e.g. 2569 -> 2026)
        targetYear = parsed > 2400 ? parsed - 543 : parsed;
      }
    }

    const overview = await getExecutiveFinancialOverviewData(targetYear);
    return apiOk(overview ?? getZeroFinancialOverview(targetYear));
  } catch (error) {
    console.error("Unable to load executive financial overview from DB", error);
    return apiOk(getZeroFinancialOverview(targetYear));
  }
}
