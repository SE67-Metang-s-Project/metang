import { apiError } from "@/lib/api-response";
import { getSignedInContext } from "@/lib/loan-auth";
import { isUuid } from "@/lib/loan-validation";
import { prisma } from "@/lib/prisma";
import { canReadRepaymentSlip } from "@/lib/slip-access";
import { serveSlip } from "@/lib/slip-storage";

type Params = { params: Promise<{ id: string }> };

// The slip bucket is private, so this route is the only way to read a repayment slip: it streams
// the bytes itself, so no storage URL - not even a short-lived signed one, which is a bearer link -
// ever reaches the browser. Authorization runs on every request that reaches the server; the
// browser may reuse the response for up to SLIP_CACHE_CONTROL's max-age, keyed on the session
// cookie (Vary: Cookie), so a revoked role keeps an already-opened slip for at most that long.
// Mirrors app/api/fund-transactions/[id]/slip/route.ts, which does the same for disbursement
// evidence - the only differences are the id space (uuid, not BigInt) and the access rule.
/**
 * Stream a payment's repayment slip evidence.
 * @description Answers the slip image itself (JPEG, PNG, GIF, WebP, BMP or AVIF), so use it as an image source: `<img src="/api/payments/{id}/slip">`. No storage URL is ever returned.
 * @tag Payment slips
 * @pathParams PaymentIdParams
 * @auth cookieAuth
 * @response 200
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 404:ApiErrorResponse
 * @add 422:ApiErrorResponse
 * @add 500:ApiErrorResponse
 */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  // Start the lookup now so it overlaps auth: one DB round trip per image instead of two. A
  // PrismaPromise is lazy until .then/.catch, so this .catch starts it and keeps a rejection
  // handled on the early returns; awaiting it below still rethrows. Only a well-formed uuid is
  // looked up - Prisma rejects anything else (P2007).
  const lookup = isUuid(id)
    ? prisma.payment.findUnique({
        where: { id },
        select: { slipPath: true, loan: { select: { studentCode: true, advisorId: true } } },
      })
    : null;
  lookup?.catch(() => {});

  // Authenticate before validating: unlike the admin routes, anyone signed in can reach this one,
  // so an anonymous caller gets 401 rather than a hint about the expected id shape. The lookup is
  // not awaited until after this, so nothing about it (result, error, timing) reaches that caller.
  const context = await getSignedInContext();
  if (!context) return apiError("UNAUTHORIZED", "Authentication required", 401);
  if (!lookup) {
    return apiError("VALIDATION_ERROR", "id must be a payment uuid, not an installment id", 422);
  }

  try {
    const payment = await lookup;
    if (!payment?.slipPath) return apiError("NOT_FOUND", "Slip not found", 404);

    // A user can hold several roles; any one of them granting read is enough.
    const allowed = context.user.roles.some(({ role }) =>
      canReadRepaymentSlip(role, context.user.id, payment),
    );
    if (!allowed) return apiError("FORBIDDEN", "Not allowed to read this slip", 403);

    return await serveSlip({ path: payment.slipPath });
  } catch (error) {
    console.error("Unable to read repayment slip", error);
    return apiError("INTERNAL_ERROR", "Unable to read slip", 500);
  }
}
