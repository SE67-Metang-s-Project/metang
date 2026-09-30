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

// Reminders go out 3, 1 and 0 days before the due date, and 1, 3 and 7 days after it while the
// installment is still unpaid.
export const INSTALLMENT_REMINDER_OFFSETS = [
  3, 1, 0, -1, -3, -7,
] as const satisfies readonly InstallmentReminderOffsetDays[];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days from the due date to today; both are Bangkok dates stored at UTC midnight. */
export function daysOverdue(dueDate: Date, today: Date): number {
  return Math.round((today.getTime() - dueDate.getTime()) / DAY_MS);
}

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
    typeof (value as Record<string, unknown>).installmentId === "string" &&
    /^\d+$/.test((value as Record<string, unknown>).installmentId as string)
  );
}
