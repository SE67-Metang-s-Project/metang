import { DisbursementError, disburseLoanRequest } from "@/db/queries/loan-requests";
import { apiError, apiOk } from "@/lib/api-response";
import { Prisma } from "@/lib/generated/prisma/client";
import { getAdminAccess } from "@/lib/loan-auth";
import { isLoanId } from "@/lib/loan-validation";
import { isSameOrigin } from "@/lib/request-security";
import { serializeJson } from "@/lib/serialization";
import { buildSlipPath, extensionForSlipContentType, MAX_SLIP_BYTES, uploadSlip } from "@/lib/slip-storage";

type Params = { params: Promise<{ id: string }> };

/**
 * Disburse a loan request awaiting manual disbursement (multipart/form-data, a single "slip"
 * file field - image/jpeg, image/png, or application/pdf, up to 10MB).
 * @tag Admin loans
 * @pathParams LoanRequestIdParams
 * @body DisburseLoanRequestBody
 * @auth cookieAuth
 * @response 200:AdminLoanRequestDetailResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 404:ApiErrorResponse
 * @add 409:ApiErrorResponse
 * @add 422:ApiErrorResponse
 * @add 500:ApiErrorResponse
 */
export async function POST(request: Request, { params }: Params) {
  // This route accepts multipart/form-data (a file upload), not JSON, so validateJsonRequest
  // (which requires application/json) does not apply - check same-origin directly instead.
  if (!isSameOrigin(request)) {
    return apiError("FORBIDDEN", "A same-origin request is required", 403);
  }

  const access = await getAdminAccess();
  if (access.status === "unauthenticated") {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }
  if (access.status === "forbidden") {
    return apiError("FORBIDDEN", "Admin access required", 403);
  }

  const { id } = await params;
  if (!isLoanId(id)) return apiError("NOT_FOUND", "Loan request not found", 404);

  const formData = await request.formData();
  const slip = formData.get("slip");
  if (!(slip instanceof File) || slip.size === 0) {
    return apiError("VALIDATION_ERROR", "A slip file is required", 422);
  }
  const ext = extensionForSlipContentType(slip.type);
  if (!ext) return apiError("VALIDATION_ERROR", "Unsupported slip file type", 422);
  if (slip.size > MAX_SLIP_BYTES) {
    return apiError("VALIDATION_ERROR", "Slip file exceeds the 10MB limit", 422);
  }

  const slipPath = buildSlipPath({ kind: "disbursement", loanId: id, ext });

  try {
    const bytes = new Uint8Array(await slip.arrayBuffer());
    await uploadSlip({ path: slipPath, contentType: slip.type, bytes });
  } catch (error) {
    console.error("Unable to upload disbursement slip", error);
    return apiError("INTERNAL_ERROR", "Unable to upload slip", 500);
  }

  try {
    // ponytail: orphaned slip object on failed disbursement, add a cleanup sweep if this becomes
    // a real cost problem - the slip above is already durably stored and cannot be rolled back.
    const loan = await disburseLoanRequest({ id, adminId: access.context.user.id, slipPath });
    return apiOk(serializeJson(loan));
  } catch (error) {
    if (error instanceof DisbursementError && error.code === "NOT_FOUND") {
      return apiError("NOT_FOUND", "Loan request not found", 404);
    }
    if (error instanceof DisbursementError && error.code === "STALE_DECISION") {
      return apiError("CONFLICT", "The loan is no longer awaiting disbursement", 409);
    }
    if (error instanceof DisbursementError && error.code === "ACCESS_REVOKED") {
      return apiError("CONFLICT", "The request changed; please retry", 409);
    }
    if (error instanceof DisbursementError && error.code === "DUPLICATE_DISBURSEMENT") {
      return apiError("CONFLICT", "The loan was already disbursed", 409);
    }
    if (error instanceof DisbursementError && error.code === "INSUFFICIENT_FUNDS") {
      return apiError(
        "INSUFFICIENT_FUNDS",
        "Insufficient fund balance for this disbursement",
        409,
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P2002", "P2034"].includes(error.code)
    ) {
      return apiError("CONFLICT", "The loan was already disbursed", 409);
    }
    console.error("Unable to disburse loan request", error);
    return apiError("INTERNAL_ERROR", "Unable to disburse loan request", 500);
  }
}
