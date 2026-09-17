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
const RETRY_BACKOFF_MINUTES = [1, 5, 15, 60];
const CLAIM_LEASE_MINUTES = 15;

/**
 * Atomically claims up to `limit` due rows and marks them `processing` in the same transaction that
 * holds `FOR UPDATE SKIP LOCKED` on them, so two workers running concurrently never claim the same
 * row.
 *
 * A claim is a lease, not a handover: `available_at` is pushed CLAIM_LEASE_MINUTES into the future,
 * and an expired `processing` row is claimable again. Without that, a worker dying between claim
 * and markDelivered/markFailed would strand the row forever. The lease is far longer than the
 * route's maxDuration so a reclaim can never race a still-running worker.
 *
 * attempt_count increments here rather than only in markFailed: a row that reliably kills its
 * worker would otherwise loop claim -> crash -> reclaim forever and never reach MAX_ATTEMPTS.
 */
export async function claimDueNotifications(limit: number) {
  return prisma.$transaction(async (tx) => {
    const claimable = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM notification_outbox
      WHERE status IN ('pending', 'retry', 'processing') AND available_at <= now()
      ORDER BY available_at
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    `;
    if (claimable.length === 0) return [];

    const ids = claimable.map((row) => row.id);
    await tx.notificationOutbox.updateMany({
      where: { id: { in: ids } },
      data: {
        status: "processing",
        attemptCount: { increment: 1 },
        availableAt: new Date(Date.now() + CLAIM_LEASE_MINUTES * 60_000),
      },
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
 *
 * Assumes the row was already claimed - claimDueNotifications does the attempt_count increment, so
 * calling this on an unclaimed row undercounts attempts by one.
 */
export async function markFailed(
  id: string,
  error: string,
  options: { permanent?: boolean } = {},
) {
  const current = await prisma.notificationOutbox.findUniqueOrThrow({ where: { id } });
  const permanent = options.permanent === true || current.attemptCount >= MAX_ATTEMPTS;
  const backoffMinutes =
    RETRY_BACKOFF_MINUTES[
      Math.min(Math.max(current.attemptCount - 1, 0), RETRY_BACKOFF_MINUTES.length - 1)
    ];

  return prisma.notificationOutbox.update({
    where: { id },
    data: {
      status: permanent ? "failed" : "retry",
      lastError: error,
      availableAt: permanent ? current.availableAt : new Date(Date.now() + backoffMinutes * 60_000),
    },
  });
}

/**
 * A reminder that became moot before delivery - terminal, but never emailed. `deliveredAt` stays
 * null, which is what distinguishes a skip from a real send.
 */
export function markSkipped(id: string, reason: string) {
  return prisma.notificationOutbox.update({
    where: { id },
    data: { status: "delivered", deliveredAt: null, lastError: reason },
  });
}
