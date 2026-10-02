import type { LoanStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ReviewerRole } from "@/lib/reviewer-deeplink";

export const INSTALLMENT_REMINDER_EVENT = "installment_reminder" as const;

// Days from the send date until the due date: positive before it, 0 on it, negative after it.
export type InstallmentReminderOffsetDays = 3 | 1 | 0 | -1 | -3 | -7;

export type InstallmentReminderDedupeKey =
  `installment-reminder:${string}:${string}:${InstallmentReminderOffsetDays}`;

export type InstallmentReminderPayload = {
  loanId: string;
  installmentId: string;
};

export const REVIEWER_NOTIFICATION_EVENT = "reviewer_notification" as const;

/** Keyed on the audit-log row id, which is one per workflow transition, so a loan legitimately
 *  re-entering a status enqueues a new notification instead of colliding with the earlier one. */
export type ReviewerNotificationDedupeKey = `reviewer-notification:${string}:${string}`;

export type ReviewerNotificationPayload = {
  loanId: string;
  status: LoanStatus;
  role: ReviewerRole;
  recipientEmail: string;
};

export const PAYMENT_OUTCOME_EVENT = "payment_outcome" as const;

/** Keyed on the payment alone: the decision CAS lets a payment leave pending_review only once,
 *  so one payment can only ever have one outcome to announce. */
export type PaymentOutcomeDedupeKey = `payment-outcome:${string}`;

/** Ids only. The recipient, amount, and reviewer note are read at delivery time from the payment
 *  row, so the outbox never holds slip evidence, a storage path, or bank data. */
export type PaymentOutcomePayload = {
  paymentId: string;
  loanId: string;
};

export const LOAN_OUTCOME_EVENT = "loan_outcome" as const;

export type LoanOutcome = "disbursed" | "rejected";

/** Keyed on loan and outcome: a loan is disbursed at most once (one disbursement ledger row per
 *  loan) and a rejection is terminal, so each outcome can only be announced once. */
export type LoanOutcomeDedupeKey = `loan-outcome:${string}:${LoanOutcome}`;

/** Ids only. The recipient, amounts, schedule, and reviewer reason are read at delivery time. */
export type LoanOutcomePayload = {
  loanId: string;
  outcome: LoanOutcome;
};

export type EnqueueNotificationInput =
  | {
      dedupeKey: InstallmentReminderDedupeKey;
      eventType: typeof INSTALLMENT_REMINDER_EVENT;
      payload: InstallmentReminderPayload;
    }
  | {
      dedupeKey: ReviewerNotificationDedupeKey;
      eventType: typeof REVIEWER_NOTIFICATION_EVENT;
      payload: ReviewerNotificationPayload;
    }
  | {
      dedupeKey: PaymentOutcomeDedupeKey;
      eventType: typeof PAYMENT_OUTCOME_EVENT;
      payload: PaymentOutcomePayload;
    }
  | {
      dedupeKey: LoanOutcomeDedupeKey;
      eventType: typeof LOAN_OUTCOME_EVENT;
      payload: LoanOutcomePayload;
    };

/**
 * A transaction client of the EXTENDED client lib/prisma exports. `Prisma.TransactionClient`
 * describes the base client and an extended one is not assignable to it, which is why callers
 * were casting. `prisma` itself satisfies this too, so a helper can take either.
 */
export type TxClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/** Idempotent enqueue: a repeat call with the same dedupeKey is a no-op. */
export function enqueueNotification(tx: TxClient, input: EnqueueNotificationInput) {
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
 *
 * eventType is required, not optional: every worker handles exactly one event type and marks any
 * row it does not recognise as permanently failed, so a worker that claimed indiscriminately would
 * silently destroy another worker's rows. An optional filter invites a caller to omit it and
 * reintroduce that. The (status, available_at) index does not cover event_type, so it is filtered
 * after the index scan - fine at this volume, and not worth a migration to widen the index.
 */
export async function claimDueNotifications(limit: number, eventType: string) {
  return prisma.$transaction(async (tx) => {
    const claimable = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM notification_outbox
      WHERE event_type = ${eventType}
        AND status IN ('pending', 'retry', 'processing')
        AND available_at <= now()
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

/**
 * Finishes a row without keeping it: no delivery history is logged. Only for events nothing
 * enqueues a second time. Reviewer notices are keyed on the audit-log row of one transition, and
 * the outcome events are no longer written. Do NOT use it for installment reminders: their
 * dedupe_key row is what stops a restarted scheduler from emailing the same reminder again, so
 * they keep markDelivered. `deleteMany` instead of `delete`, so a row that is already gone (a
 * reclaimed lease) is not an error.
 */
export function deleteFinished(id: string) {
  return prisma.notificationOutbox.deleteMany({ where: { id } });
}
