import { apiError } from "@/lib/api-response";
import { getSignedInContext } from "@/lib/loan-auth";
import { prisma } from "@/lib/prisma";
import { canReadDisbursementSlip } from "@/lib/slip-access";
import { SLIP_REDIRECT_CACHE_CONTROL, signSlipUrl } from "@/lib/slip-storage";

type Params = { params: Promise<{ id: string }> };

// The slip bucket is private, so this route is the only way to read a slip: the signed URL is
// minted per request and never stored. Authorization runs on every request that reaches the
// server; the browser may reuse a 302 for up to SLIP_REDIRECT_CACHE_CONTROL's max-age, keyed on
// the session cookie (Vary: Cookie) - fund transaction ids are sequential, so without Vary the
// next user on a shared browser could replay a cached redirect just by walking the ids.
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
  // The guard also keeps BigInt(id) below from throwing: 18 digits always fit a Postgres bigint.
  if (!/^\d{1,18}$/.test(id)) return apiError("NOT_FOUND", "Slip not found", 404);

  // Start the lookup now so it overlaps auth: one DB round trip per image instead of two. A
  // PrismaPromise is lazy until .then/.catch, so this .catch starts it and keeps a rejection
  // handled on the early return; awaiting it below still rethrows. The lookup is not awaited
  // until the caller is signed in, so nothing about it (result, error, timing) reaches a 401.
  const lookup = prisma.fundTransaction.findUnique({
    where: { id: BigInt(id) },
    select: { slipPath: true, loan: { select: { studentId: true } } },
  });
  lookup.catch(() => {});

  const context = await getSignedInContext();
  if (!context) return apiError("UNAUTHORIZED", "Authentication required", 401);

  try {
    const transaction = await lookup;
    if (!transaction?.slipPath) return apiError("NOT_FOUND", "Slip not found", 404);

    // A user can hold several roles; any one of them granting read is enough.
    const allowed = context.user.roles.some(({ role }) =>
      canReadDisbursementSlip(role, context.user.id, transaction),
    );
    if (!allowed) return apiError("FORBIDDEN", "Not allowed to read this slip", 403);

    const url = await signSlipUrl({ path: transaction.slipPath });
    return new Response(null, {
      status: 302,
      headers: { Location: url, "Cache-Control": SLIP_REDIRECT_CACHE_CONTROL, Vary: "Cookie" },
    });
  } catch (error) {
    console.error("Unable to sign slip URL", error);
    return apiError("INTERNAL_ERROR", "Unable to read slip", 500);
  }
}
