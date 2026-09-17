import type {
  InstallmentReminderOffsetDays,
  InstallmentReminderDedupeKey,
  InstallmentReminderPayload,
} from "@/db/queries/notifications";

// Redeclared, not imported as a value, from db/queries/notifications - that module pulls in
// lib/prisma (throws without DATABASE_URL), and this file must stay importable in pure unit tests.
export const INSTALLMENT_REMINDER_EVENT = "installment_reminder" as const;

export type {
  InstallmentReminderOffsetDays,
  InstallmentReminderDedupeKey,
  InstallmentReminderPayload,
};

export function buildInstallmentReminderDedupeKey(
  installmentId: string | bigint,
  isoDueDate: string,
  offsetDays: InstallmentReminderOffsetDays,
): InstallmentReminderDedupeKey {
  return `installment-reminder:${installmentId}:${isoDueDate}:${offsetDays}`;
}

export function isInstallmentReminderPayload(value: unknown): value is InstallmentReminderPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "loanId" in value &&
    typeof (value as Record<string, unknown>).loanId === "string" &&
    "installmentId" in value &&
    typeof (value as Record<string, unknown>).installmentId === "string"
  );
}
