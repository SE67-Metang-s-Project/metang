import { EmailApiError } from "@/lib/email-api/types";

export function classifyDeliveryFailure(error: unknown): "retryable" | "permanent" {
  if (error instanceof EmailApiError) {
    if (error.status === undefined || error.status >= 500) {
      return "retryable";
    }
  }
  return "permanent";
}
