import {
  createFundTransaction,
  FundMutationError,
  getFundBalance,
  listFundTransactions,
} from "@/db/queries/fund-transactions";
import { apiError, apiOk } from "@/lib/api-response";
import { getSuperAdminAccess } from "@/lib/loan-auth";
import { parseFundTransactionInput } from "@/lib/loan-validation";
import { serializeJson } from "@/lib/serialization";
import { validateJsonRequest } from "@/lib/request-security";

/**
 * List fund ledger transactions and the current fund balance.
 * @tag SuperAdmin fund
 * @auth cookieAuth
 * @response 200:FundTransactionListResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 500:ApiErrorResponse
 */
export async function GET() {
  const access = await getSuperAdminAccess();
  if (access.status === "unauthenticated") {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }
  if (access.status === "forbidden") {
    return apiError("FORBIDDEN", "SuperAdmin access required", 403);
  }

  try {
    const [balance, transactions] = await Promise.all([getFundBalance(), listFundTransactions()]);
    return apiOk(serializeJson({ balance, transactions }));
  } catch (error) {
    console.error("Unable to list fund transactions", error);
    return apiError("INTERNAL_ERROR", "Unable to list fund transactions", 500);
  }
}

/**
 * Record a manual fund transaction (top-up, withdrawal, or adjustment).
 * @tag SuperAdmin fund
 * @body FundTransactionBody
 * @auth cookieAuth
 * @response 200:FundTransactionResponse
 * @add 401:ApiErrorResponse
 * @add 403:ApiErrorResponse
 * @add 409:ApiErrorResponse
 * @add 422:ApiErrorResponse
 * @add 500:ApiErrorResponse
 */
export async function POST(request: Request) {
  const requestError = validateJsonRequest(request);
  if (requestError) return requestError;

  const access = await getSuperAdminAccess();
  if (access.status === "unauthenticated") {
    return apiError("UNAUTHORIZED", "Authentication required", 401);
  }
  if (access.status === "forbidden") {
    return apiError("FORBIDDEN", "SuperAdmin access required", 403);
  }

  let input;
  try {
    input = parseFundTransactionInput(await request.json());
  } catch (error) {
    return apiError(
      "VALIDATION_ERROR",
      error instanceof Error ? error.message : "Invalid request",
      422,
    );
  }

  try {
    const transaction = await createFundTransaction({
      actorId: access.context.user.id,
      kind: input.kind,
      amount: input.amount,
      note: input.note,
    });
    return apiOk(serializeJson(transaction));
  } catch (error) {
    if (error instanceof FundMutationError) {
      if (error.code === "ACCESS_REVOKED") {
        return apiError("CONFLICT", "The request changed; please retry", 409);
      }
      if (error.code === "INVALID_AMOUNT") {
        return apiError("VALIDATION_ERROR", "amount is invalid", 422);
      }
      if (error.code === "REASON_REQUIRED") {
        return apiError("VALIDATION_ERROR", "A note is required for this transaction kind", 422);
      }
      if (error.code === "INSUFFICIENT_BALANCE") {
        return apiError("INSUFFICIENT_FUNDS", "The fund balance cannot go negative", 409);
      }
    }
    console.error("Unable to create fund transaction", error);
    return apiError("INTERNAL_ERROR", "Unable to create fund transaction", 500);
  }
}
