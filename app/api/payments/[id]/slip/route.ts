import { apiError } from "@/lib/api-response";
import { getSignedInContext } from "@/lib/loan-auth";
import { isUuid } from "@/lib/loan-validation";
import { prisma } from "@/lib/prisma";
import { canReadRepaymentSlip } from "@/lib/slip-access";
import { signSlipUrl } from "@/lib/slip-storage";

type Params = { params: Promise<{ id: string }> };

// The slip bucket is private, so this route is the only way to read a repayment slip: the signed
// URL is minted per request and never stored, and authorization re-runs on every image load.
// Mirrors app/api/fund-transactions/[id]/slip/route.ts, which does the same for disbursement
// evidence - the only differences are the id space (uuid, not BigInt) and the access rule.
/**
 * Redirect to a short-lived signed URL for a payment's repayment slip evidence.
 * @description Use it as an image source - `<img src="/api/payments/{id}/slip">`. Testing it from this page fails with "Failed to fetch": the 302 target is cross-origin and Supabase answers `Access-Control-Allow-Origin: *`, which a credentialed fetch rejects. An `<img>` load is not a credentialed CORS request, so it is unaffected.
 * @tag Payment slips
 * @pathParams PaymentIdParams
 * @auth cookieAuth
 * @response 302
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 404:ApiErrorResponse
 * @add 422:ApiErrorResponse
 * @add 500:ApiErrorResponse
 */
export async function GET(_request: Request, { params }: Params) {
  // Authenticate before validating: unlike the admin routes, anyone signed in can reach this one,
  // so an anonymous caller gets 401 rather than a hint about the expected id shape.
  const context = await getSignedInContext();
  if (!context) return apiError("UNAUTHORIZED", "Authentication required", 401);

  const { id } = await params;
  if (!isUuid(id)) {
    return apiError("VALIDATION_ERROR", "id must be a payment uuid, not an installment id", 422);
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      select: { slipPath: true, loan: { select: { studentId: true } } },
    });
    if (!payment?.slipPath) return apiError("NOT_FOUND", "Slip not found", 404);

    // A user can hold several roles; any one of them granting read is enough.
    const allowed = context.user.roles.some(({ role }) =>
      canReadRepaymentSlip(role, context.user.id, payment),
    );
    if (!allowed) return apiError("FORBIDDEN", "Not allowed to read this slip", 403);

    const url = await signSlipUrl({ path: payment.slipPath });
    return new Response(null, {
      status: 302,
      headers: { Location: url, "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Unable to sign repayment slip URL", error);
    return apiError("INTERNAL_ERROR", "Unable to read slip", 500);
  }
}
