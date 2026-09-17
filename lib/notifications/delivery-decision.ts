import {
  INSTALLMENT_REMINDER_EVENT,
  isInstallmentReminderPayload,
} from "./installment-reminder";

export type InstallmentForDelivery = {
  settledAt: Date | null;
  amountDue: number;
  amountPaid: number;
  loan: { status: string };
};

export type ParsedReminderRow =
  | { kind: "ok"; installmentId: bigint }
  | { kind: "fail"; message: string };

/** The `send` variant carries the installment so callers narrow it by the decision rather than
 *  asserting non-null - "not skipped" implying "not null" is an invariant of the rules below. */
export type DeliveryDecision<T extends InstallmentForDelivery> =
  | { kind: "send"; amountRemaining: number; installment: T }
  | { kind: "skip"; reason: string };

export function parseReminderRow(row: { eventType: string; payload: unknown }): ParsedReminderRow {
  if (row.eventType !== INSTALLMENT_REMINDER_EVENT) {
    return { kind: "fail", message: `unsupported eventType: ${row.eventType}` };
  }
  if (!isInstallmentReminderPayload(row.payload)) {
    return { kind: "fail", message: "malformed payload" };
  }
  return { kind: "ok", installmentId: BigInt(row.payload.installmentId) };
}

export function decideDelivery<T extends InstallmentForDelivery>(
  installment: T | null,
): DeliveryDecision<T> {
  if (!installment) {
    return { kind: "skip", reason: "installment no longer exists" };
  }
  if (installment.settledAt) {
    return { kind: "skip", reason: "installment already settled" };
  }
  if (installment.loan.status !== "disbursed") {
    return { kind: "skip", reason: `loan is not disbursed (status: ${installment.loan.status})` };
  }

  const amountRemaining = installment.amountDue - installment.amountPaid;
  if (amountRemaining <= 0) {
    return { kind: "skip", reason: "installment has no remaining balance" };
  }

  return { kind: "send", amountRemaining, installment };
}
