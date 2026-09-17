import { EmailApiError } from "@/lib/email-api/types";

const RETRYABLE_STATUSES = new Set([408, 429]);

export function classifyDeliveryFailure(error: unknown): "retryable" | "permanent" {
  if (error instanceof EmailApiError) {
    if (error.status === undefined || error.status >= 500 || RETRYABLE_STATUSES.has(error.status)) {
      return "retryable";
    }
  }
  return "permanent";
}
