import { apiError } from "@/lib/api-response";
import { getSignedInContext } from "@/lib/loan-auth";
import { prisma } from "@/lib/prisma";
import { canReadDisbursementSlip } from "@/lib/slip-access";
import { signSlipUrl } from "@/lib/slip-storage";

type Params = { params: Promise<{ id: string }> };

// The slip bucket is private, so this route is the only way to read a slip: the signed URL is
// minted per request and never stored, and authorization re-runs on every image load.
/**
 * Redirect to a short-lived signed URL for a fund transaction's slip evidence.
 * @description Use it as an image source - `<img src="/api/fund-transactions/{id}/slip">`. Testing it from this page fails with "Failed to fetch": the 302 target is cross-origin and Supabase answers `Access-Control-Allow-Origin: *`, which a credentialed fetch rejects. An `<img>` load is not a credentialed CORS request, so it is unaffected.
 * @tag Fund slips
 * @pathParams FundTransactionIdParams
 * @auth cookieAuth
 * @response 302
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 404:ApiErrorResponse
 * @add 500:ApiErrorResponse
 */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!/^\d{1,18}$/.test(id)) return apiError("NOT_FOUND", "Slip not found", 404);

  const context = await getSignedInContext();
  if (!context) return apiError("UNAUTHORIZED", "Authentication required", 401);

  try {
    const transaction = await prisma.fundTransaction.findUnique({
      where: { id: BigInt(id) },
      select: { slipPath: true, loan: { select: { studentId: true } } },
    });
    if (!transaction?.slipPath) return apiError("NOT_FOUND", "Slip not found", 404);

    // A user can hold several roles; any one of them granting read is enough.
    const allowed = context.user.roles.some(({ role }) =>
      canReadDisbursementSlip(role, context.user.id, transaction),
    );
    if (!allowed) return apiError("FORBIDDEN", "Not allowed to read this slip", 403);

    const url = await signSlipUrl({ path: transaction.slipPath });
    return new Response(null, {
      status: 302,
      headers: { Location: url, "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Unable to sign slip URL", error);
    return apiError("INTERNAL_ERROR", "Unable to read slip", 500);
  }
}
