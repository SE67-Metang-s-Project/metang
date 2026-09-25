import {
  createStudentPayment,
  findRepayableLoanId,
  StudentPaymentError,
} from "@/db/queries/student-payments";
import { Prisma } from "@/lib/generated/prisma/client";
import { apiError, apiOk } from "@/lib/api-response";
import { getStudentContext } from "@/lib/loan-auth";
import { parseStudentPaymentInput } from "@/lib/loan-validation";
import { isSameOrigin } from "@/lib/request-security";
import { serializeJson } from "@/lib/serialization";
import {
  buildSlipPath,
  extensionForSlipContentType,
  MAX_SLIP_BYTES,
  uploadSlip,
} from "@/lib/slip-storage";

/**
 * Submit a repayment slip for the student's own loan (multipart/form-data: a `slip` file -
 * image/jpeg, image/png or application/pdf up to 10MB - plus `amount`, and optionally `paidAt`).
 * @description Takes no loan id: a student may hold only one non-terminal loan, so the server resolves the disbursed one itself and the client needs a single request. The slip is stored privately and read back only through GET /api/payments/{id}/slip. Only one submission may await review at a time. Repayment history is served by GET /api/student/loan-requests/{id}, which returns the loan's payments.
 * @tag Student payments
 * @body StudentPaymentBody
 * @auth cookieAuth
 * @response 200:StudentPaymentResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 409:ApiErrorResponse
 * @add 422:ApiErrorResponse
 * @add 500:ApiErrorResponse
 */
export async function POST(request: Request) {
  // multipart, not JSON, so validateJsonRequest does not apply - same as the disburse upload.
  if (!isSameOrigin(request)) {
    return apiError("FORBIDDEN", "A same-origin request is required", 403);
  }

  const context = await getStudentContext();
  if (!context) return apiError("UNAUTHORIZED", "Authentication required", 401);

  const formData = await request.formData();

  let input;
  try {
    input = parseStudentPaymentInput({
      amount: formData.get("amount"),
      paidAt: formData.get("paidAt"),
    });
  } catch (error) {
    return apiError(
      "VALIDATION_ERROR",
      error instanceof Error ? error.message : "Invalid request",
      422,
    );
  }

  const slip = formData.get("slip");
  if (!(slip instanceof File) || slip.size === 0) {
    return apiError("VALIDATION_ERROR", "A slip file is required", 422);
  }
  const ext = extensionForSlipContentType(slip.type);
  if (!ext) return apiError("VALIDATION_ERROR", "Unsupported slip file type", 422);
  if (slip.size > MAX_SLIP_BYTES) {
    return apiError("VALIDATION_ERROR", "Slip file exceeds the 10MB limit", 422);
  }

  // Resolved before the upload only because the slip path is keyed by loan; createStudentPayment
  // re-checks ownership and status inside its transaction.
  const loanId = await findRepayableLoanId(context.user.id);
  if (!loanId) return apiError("CONFLICT", "You have no loan open for repayment", 409);

  const slipPath = buildSlipPath({ kind: "repayment", loanId, ext });

  try {
    const bytes = new Uint8Array(await slip.arrayBuffer());
    await uploadSlip({ path: slipPath, contentType: slip.type, bytes });
  } catch (error) {
    console.error("Unable to upload repayment slip", error);
    return apiError("INTERNAL_ERROR", "Unable to upload slip", 500);
  }

  try {
    // ponytail: orphaned slip object if the insert below fails - same tradeoff the disburse route
    // takes, since the object is already durably stored and cannot be rolled back.
    const submit = () =>
      createStudentPayment({
        loanId,
        studentId: context.user.id,
        amount: input.amount,
        slipPath,
        paidAt: input.paidAt,
      });
    // A Serializable conflict (P2034) is transient and the slip is already stored, so re-run the
    // transaction with the same slip before giving up; the re-run re-checks every rule.
    for (let attempt = 1; ; attempt += 1) {
      try {
        return apiOk(serializeJson(await submit()));
      } catch (error) {
        if (attempt >= 3 || !isSerializationFailure(error)) throw error;
      }
    }
  } catch (error) {
    if (
      error instanceof StudentPaymentError &&
      (error.code === "LOAN_NOT_FOUND" || error.code === "LOAN_NOT_DISBURSED")
    ) {
      return apiError("CONFLICT", "You have no loan open for repayment", 409);
    }
    if (error instanceof StudentPaymentError && error.code === "REVIEW_IN_PROGRESS") {
      return apiError("CONFLICT", "A payment is already awaiting review", 409);
    }
    if (error instanceof StudentPaymentError && error.code === "NOTHING_OUTSTANDING") {
      return apiError("CONFLICT", "This loan has nothing left to repay", 409);
    }
    if (isSerializationFailure(error)) {
      return apiError("CONFLICT", "The request changed; please try again", 409);
    }
    console.error("Unable to submit repayment", error);
    return apiError("INTERNAL_ERROR", "Unable to submit repayment", 500);
  }
}

function isSerializationFailure(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}
