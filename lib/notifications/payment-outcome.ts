import type { PaymentOutcomeDedupeKey, PaymentOutcomePayload } from "@/db/queries/notifications";

// Redeclared, not imported as a value, from db/queries/notifications - that module pulls in
// lib/prisma (throws without DATABASE_URL), and this file must stay importable in pure unit tests.
export const PAYMENT_OUTCOME_EVENT = "payment_outcome" as const;

export type { PaymentOutcomeDedupeKey, PaymentOutcomePayload };

export function buildPaymentOutcomeDedupeKey(paymentId: string): PaymentOutcomeDedupeKey {
  return `payment-outcome:${paymentId}`;
}

export function isPaymentOutcomePayload(value: unknown): value is PaymentOutcomePayload {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).paymentId === "string" &&
    typeof (value as Record<string, unknown>).loanId === "string"
  );
}

export type PaymentForOutcomeDelivery = {
  status: string;
};

export type ParsedPaymentOutcomeRow =
  | { kind: "ok"; paymentId: string }
  | { kind: "fail"; message: string };

/** The `send` variant carries the payment and its settled outcome so callers narrow on the
 *  decision rather than re-checking the status. */
export type PaymentOutcomeDecision<T extends PaymentForOutcomeDelivery> =
  | { kind: "send"; outcome: "confirmed" | "rejected"; payment: T }
  | { kind: "skip"; reason: string };

export function parsePaymentOutcomeRow(row: {
  eventType: string;
  payload: unknown;
}): ParsedPaymentOutcomeRow {
  if (row.eventType !== PAYMENT_OUTCOME_EVENT) {
    return { kind: "fail", message: `unsupported eventType: ${row.eventType}` };
  }
  if (!isPaymentOutcomePayload(row.payload)) {
    return { kind: "fail", message: "malformed payload" };
  }
  return { kind: "ok", paymentId: row.payload.paymentId };
}

export function decidePaymentOutcomeDelivery<T extends PaymentForOutcomeDelivery>(
  payment: T | null,
): PaymentOutcomeDecision<T> {
  if (!payment) {
    return { kind: "skip", reason: "payment no longer exists" };
  }
  if (payment.status === "confirmed" || payment.status === "rejected") {
    return { kind: "send", outcome: payment.status, payment };
  }
  return { kind: "skip", reason: `payment has no decision (status: ${payment.status})` };
}
