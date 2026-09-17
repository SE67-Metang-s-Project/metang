import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const INSTALLMENT_REMINDER_EVENT = "installment_reminder" as const;

export type InstallmentReminderOffsetDays = 0 | 3;

export type InstallmentReminderDedupeKey =
  `installment-reminder:${string}:${string}:${InstallmentReminderOffsetDays}`;

export type InstallmentReminderPayload = {
  loanId: string;
  installmentId: string;
};

export type EnqueueNotificationInput = {
  dedupeKey: InstallmentReminderDedupeKey;
  eventType: typeof INSTALLMENT_REMINDER_EVENT;
  payload: InstallmentReminderPayload;
};

/** Idempotent enqueue: a repeat call with the same dedupeKey is a no-op. */
export function enqueueNotification(
  tx: Prisma.TransactionClient,
  input: EnqueueNotificationInput,
) {
  return tx.notificationOutbox.upsert({
    where: { dedupeKey: input.dedupeKey },
    create: input,
    update: {},
  });
}

const MAX_ATTEMPTS = 5;
const RETRY_BACKOFF_MINUTES = [1, 5, 15, 60, 240];

/**
 * Atomically claims up to `limit` due rows (pending or ready-for-retry, available_at reached) and
 * marks them `processing` in the same transaction that holds `FOR UPDATE SKIP LOCKED` on them, so
 * two workers running concurrently never claim the same row.
 */
export async function claimDueNotifications(limit: number) {
  return prisma.$transaction(async (tx) => {
    const claimable = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM notification_outbox
      WHERE status IN ('pending', 'retry') AND available_at <= now()
      ORDER BY available_at
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    `;
    if (claimable.length === 0) return [];

    const ids = claimable.map((row) => row.id);
    await tx.notificationOutbox.updateMany({
      where: { id: { in: ids } },
      data: { status: "processing" },
    });
    return tx.notificationOutbox.findMany({ where: { id: { in: ids } } });
  });
}

export function markDelivered(id: string) {
  return prisma.notificationOutbox.update({
    where: { id },
    data: { status: "delivered", deliveredAt: new Date() },
  });
}

/**
 * Records a failed delivery attempt. Retryable failures go back to `retry` with exponential
 * backoff; `permanent` (or exhausting MAX_ATTEMPTS) marks the row `failed` for good.
 */
export async function markFailed(
  id: string,
  error: string,
  options: { permanent?: boolean } = {},
) {
  const current = await prisma.notificationOutbox.findUniqueOrThrow({ where: { id } });
  const attemptCount = current.attemptCount + 1;
  const permanent = options.permanent === true || attemptCount >= MAX_ATTEMPTS;
  const backoffMinutes =
    RETRY_BACKOFF_MINUTES[Math.min(current.attemptCount, RETRY_BACKOFF_MINUTES.length - 1)];

  return prisma.notificationOutbox.update({
    where: { id },
    data: {
      status: permanent ? "failed" : "retry",
      attemptCount,
      lastError: error,
      availableAt: permanent ? current.availableAt : new Date(Date.now() + backoffMinutes * 60_000),
    },
  });
}
