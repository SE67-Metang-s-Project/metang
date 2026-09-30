import { apiError } from "@/lib/api-response";
import { getSignedInContext } from "@/lib/loan-auth";
import { prisma } from "@/lib/prisma";
import { canReadDisbursementSlip } from "@/lib/slip-access";
import { serveSlip } from "@/lib/slip-storage";

type Params = { params: Promise<{ id: string }> };

// The slip bucket is private, so this route is the only way to read a slip: it streams the bytes
// itself, so no storage URL - not even a short-lived signed one, which is a bearer link - ever
// reaches the browser. Authorization runs on every request that reaches the server; the browser
// may reuse the response for up to SLIP_CACHE_CONTROL's max-age, keyed on the session cookie
// (Vary: Cookie) - fund transaction ids are sequential, so without Vary the next user on a shared
// browser could replay a cached slip just by walking the ids.

/**
 * Stream a fund transaction's slip evidence.
 * @description Answers the slip image itself (JPEG, PNG, GIF, WebP, BMP or AVIF), so use it as an image source: `<img src="/api/fund-transactions/{id}/slip">`. No storage URL is ever returned.
 * @tag Fund slips
 * @pathParams FundTransactionIdParams
 * @auth cookieAuth
 * @response 200
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
    select: { slipPath: true, loan: { select: { studentCode: true } } },
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

    return await serveSlip({ path: transaction.slipPath });
  } catch (error) {
    console.error("Unable to read slip", error);
    return apiError("INTERNAL_ERROR", "Unable to read slip", 500);
  }
}
