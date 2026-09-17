import { EmailApiError } from "@/lib/email-api/types";

const RETRYABLE_STATUSES = new Set([408, 429]);

export function classifyStatusFailure(status: number | undefined): "retryable" | "permanent" {
  if (status === undefined || status >= 500 || RETRYABLE_STATUSES.has(status)) {
    return "retryable";
  }
  return "permanent";
}

export function classifyDeliveryFailure(error: unknown): "retryable" | "permanent" {
  if (error instanceof EmailApiError) {
    return classifyStatusFailure(error.status);
  }
  return "permanent";
}
