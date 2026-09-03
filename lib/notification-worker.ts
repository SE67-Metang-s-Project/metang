import "server-only";

import {
  LOAN_REVIEW_REQUESTED_EVENT,
  type LoanReviewRequestedPayload,
} from "@/db/queries/notifications";
import {
  LineNotificationError,
  sendLineNotification,
  type LineNotificationPayload,
  type LineNotificationOptions,
} from "@/lib/line-notification";
import {
  buildReviewerRequestUrl,
  type ReviewerRole,
} from "@/lib/reviewer-deeplink";

export type ClaimedNotification = {
  id: string;
  dedupeKey: string;
  eventType: string;
  payload: unknown;
  attemptCount: number;
};

/**
 * NAT-79 owns the Prisma implementation of this interface. Claiming must be an
 * atomic pending/retry -> processing update so multiple workers cannot process
 * the same outbox record at the same time.
 */
export type NotificationOutboxStore = {
  claimAvailable(limit: number): Promise<ClaimedNotification[]>;
  markDelivered(id: string, deliveredAt: Date): Promise<void>;
  recordFailure(input: {
    id: string;
    lastError: string;
  }): Promise<void>;
};

export type ReviewerRecipient = {
  id: string;
  role: ReviewerRole;
  email: string;
};

export type NotificationContentInput = {
  loanId: string;
  step: LoanReviewRequestedPayload["step"];
  recipient: ReviewerRecipient;
  weblink: string;
};

export type NotificationContent = Pick<
  LineNotificationPayload,
  "program" | "message" | "color"
>;

export type NotificationWorkerDependencies = {
  baseUrl: string;
  outbox: NotificationOutboxStore;
  resolveRecipients(payload: LoanReviewRequestedPayload): Promise<ReviewerRecipient[]>;
  buildContent(input: NotificationContentInput): NotificationContent;
  send?: (
    payload: LineNotificationPayload,
    options?: LineNotificationOptions,
  ) => Promise<{ data: "Success" }>;
};

export type NotificationDeliveryResult =
  | { id: string; status: "delivered" }
  | { id: string; status: "failed"; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseLoanReviewRequestedPayload(value: unknown): LoanReviewRequestedPayload {
  if (!isRecord(value) || typeof value.loanId !== "string" || !value.loanId.trim()) {
    throw new Error("Notification payload has an invalid loanId");
  }

  if (value.step === "advisor") {
    if (
      !isRecord(value.recipient) ||
      typeof value.recipient.userId !== "string" ||
      !value.recipient.userId.trim()
    ) {
      throw new Error("Advisor notification payload has an invalid recipient");
    }

    return {
      loanId: value.loanId,
      step: "advisor",
      recipient: { userId: value.recipient.userId },
    };
  }

  if (value.step === "admin") {
    if (
      !isRecord(value.recipient) ||
      !Array.isArray(value.recipient.roles) ||
      value.recipient.roles.length !== 2 ||
      value.recipient.roles.some((role) => role !== "admin" && role !== "super_admin")
    ) {
      throw new Error("Admin notification payload has an invalid recipient");
    }

    return {
      loanId: value.loanId,
      step: "admin",
      recipient: {
        roles: [...value.recipient.roles] as ["admin", "super_admin"],
      },
    };
  }

  if (value.step === "executive") {
    if (
      !isRecord(value.recipient) ||
      !Array.isArray(value.recipient.roles) ||
      value.recipient.roles.length !== 1 ||
      value.recipient.roles[0] !== "executive"
    ) {
      throw new Error("Executive notification payload has an invalid recipient");
    }

    return {
      loanId: value.loanId,
      step: "executive",
      recipient: { roles: ["executive"] },
    };
  }

  throw new Error("Unsupported notification payload step");
}

function getSafeErrorMessage(error: unknown) {
  if (error instanceof LineNotificationError) {
    return error.message.slice(0, 500);
  }

  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }

  return "Unexpected notification delivery failure";
}

function getRecipientIdempotencyKey(dedupeKey: string, recipient: ReviewerRecipient) {
  return `${dedupeKey}:recipient:${recipient.id}`;
}

async function deliverNotification(
  notification: ClaimedNotification,
  dependencies: NotificationWorkerDependencies,
): Promise<NotificationDeliveryResult> {
  try {
    if (notification.eventType !== LOAN_REVIEW_REQUESTED_EVENT) {
      throw new Error(`Unsupported notification event type: ${notification.eventType}`);
    }

    const payload = parseLoanReviewRequestedPayload(notification.payload);
    const recipients = await dependencies.resolveRecipients(payload);

    if (recipients.length === 0) {
      throw new Error("No eligible reviewer recipient was found");
    }

    const send = dependencies.send ?? sendLineNotification;

    await Promise.all(
      recipients.map(async (recipient) => {
        const weblink = buildReviewerRequestUrl(
          dependencies.baseUrl,
          recipient.role,
          payload.loanId,
        );
        const content = dependencies.buildContent({
          loanId: payload.loanId,
          step: payload.step,
          recipient,
          weblink,
        });

        await send(
          {
            ...content,
            email: recipient.email,
            weblink,
          },
          { idempotencyKey: getRecipientIdempotencyKey(notification.dedupeKey, recipient) },
        );
      }),
    );

    await dependencies.outbox.markDelivered(notification.id, new Date());
    return { id: notification.id, status: "delivered" };
  } catch (error) {
    const message = getSafeErrorMessage(error);

    await dependencies.outbox.recordFailure({
      id: notification.id,
      lastError: message,
    });

    return { id: notification.id, status: "failed", error: message };
  }
}

export function createNotificationWorker(dependencies: NotificationWorkerDependencies) {
  return {
    async run(batchSize = 20): Promise<NotificationDeliveryResult[]> {
      if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 100) {
        throw new Error("batchSize must be an integer between 1 and 100");
      }

      const claimed = await dependencies.outbox.claimAvailable(batchSize);
      return Promise.all(
        claimed.map((notification) => deliverNotification(notification, dependencies)),
      );
    },
  };
}
