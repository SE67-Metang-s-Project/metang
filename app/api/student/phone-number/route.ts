import { apiError, apiOk } from "@/lib/api-response";
import { getStudentContext } from "@/lib/loan-auth";
import type { PhoneNumberBody } from "@/lib/loan-api-types";
import { parsePhoneNumber } from "@/lib/loan-validation";
import { prisma } from "@/lib/prisma";
import { validateJsonRequest } from "@/lib/request-security";

/**
 * Save the current student's phone number.
 * @tag Student
 * @auth cookieAuth
 * @body PhoneNumberBody
 * @response 200:PhoneNumberResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 409:ApiErrorResponse
 * @add 422:ApiErrorResponse
 * @add 500:ApiErrorResponse
 */

export async function POST(request: Request) {
  const requestError = validateJsonRequest(request);
  if (requestError) return requestError;

  const context = await getStudentContext();
  if (!context) return apiError("UNAUTHORIZED", "Authentication required", 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "A JSON request body is required", 422);
  }

  let phoneNumber;
  try {
    const input = body as Partial<PhoneNumberBody>;
    phoneNumber = parsePhoneNumber(body && typeof body === "object" ? input.phoneNumber : null);
  } catch (error) {
    return apiError(
      "VALIDATION_ERROR",
      error instanceof Error ? error.message : "phoneNumber is invalid",
      422,
    );
  }

  // Students have no app_user row: the phone lives on their open loan request (at most one, see
  // one_open_loan_per_student), so a closed loan's contact number is never rewritten. A new loan
  // takes phoneNumber from POST /api/student/loan-requests.
  const updated = await prisma.loanRequest.updateMany({
    where: { studentCode: context.user.studentCode, status: { notIn: ["closed", "rejected", "cancelled"] } },
    data: { studentPhone: phoneNumber },
  });
  if (updated.count !== 1) {
    return apiError("CONFLICT", "Submit a loan request before saving a phone number", 409);
  }

  return apiOk({ phone: phoneNumber });
}

/**
 * Get the current student's phone number.
 * @tag Student
 * @auth cookieAuth
 * @response 200:PhoneNumberResponse
 * @add 401:ApiErrorResponse
 * @add 500:ApiErrorResponse
 */
export async function GET() {
  const context = await getStudentContext();
  if (!context) return apiError("UNAUTHORIZED", "Authentication required", 401);

  return apiOk({ phone: context.user.phone });
}
