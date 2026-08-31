import type { Prisma } from "@/lib/generated/prisma/client";

export const LOAN_REVIEW_REQUESTED_EVENT = "loan.review_requested" as const;

export type LoanReviewRequestedStep = "advisor" | "admin";

export type LoanReviewRequestedDedupeKey =
  `loan:${string}:review:${LoanReviewRequestedStep}:${number}`;

export type LoanReviewRequestedPayload =
  | {
      loanId: string;
      step: "advisor";
      recipient: { userId: string };
    }
  | {
      loanId: string;
      step: "admin";
      recipient: { roles: ["admin", "super_admin"] };
    };

export type EnqueueNotificationInput = {
  dedupeKey: LoanReviewRequestedDedupeKey;
  eventType: typeof LOAN_REVIEW_REQUESTED_EVENT;
  payload: LoanReviewRequestedPayload;
};

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
