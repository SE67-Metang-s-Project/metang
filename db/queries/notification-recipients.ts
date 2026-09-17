import { prisma } from "@/lib/prisma";
import { Prisma, UserRoleName } from "@/lib/generated/prisma/client";
import {
  REVIEWER_NOTIFICATION_EVENT,
  enqueueNotification,
  type TxClient,
} from "@/db/queries/notifications";
import { type ReviewerRole, buildRequestUrlForPath } from "@/lib/reviewer-deeplink";
import {
  REVIEWER_STEP_BY_STATUS,
  buildReviewerNotificationPayload,
  type ReviewerNotificationStep,
} from "@/lib/line-notification-template";
import {
  sendLineNotification,
  type LineNotificationResponse,
} from "@/lib/line-notification";

/** Either the shared client or an open transaction's client, so a reader can run inside the
 *  transaction that is writing the rows it needs to see. */
type DbClient = TxClient;

export async function getAdvisorRecipientEmail(advisorId: string): Promise<string> {
  const user = await prisma.appUser.findUniqueOrThrow({
    where: { id: advisorId },
    select: { email: true },
  });
  return user.email;
}

export async function getAdminRecipientEmails(
  assignedAdminId: string | null,
  db: DbClient = prisma,
): Promise<string[]> {
  if (assignedAdminId) {
    const user = await db.appUser.findUniqueOrThrow({
      where: { id: assignedAdminId },
      select: {
        email: true,
        roles: { select: { role: true } },
      },
    });
    const stillAdmin = user.roles.some(
      ({ role }) => role === UserRoleName.admin || role === UserRoleName.super_admin,
    );
    if (stillAdmin) return [user.email];
  }

  const users = await db.appUser.findMany({
    where: {
      roles: {
        some: {
          role: { in: [UserRoleName.admin, UserRoleName.super_admin] },
        },
      },
    },
    select: { email: true },
  });
  return users.map((u) => u.email);
}

export async function getExecutiveRecipientEmail(
  db: DbClient = prisma,
): Promise<string | null> {
  const user = await db.appUser.findFirst({
    where: {
      roles: {
        some: { role: UserRoleName.executive },
      },
    },
    select: { email: true },
  });
  return user?.email ?? null;
}

export async function getLoanRoutingIds(
  loanId: string,
): Promise<{ advisorId: string; assignedAdminId: string | null } | null> {
  return prisma.loanRequest.findUnique({
    where: { id: loanId },
    select: { advisorId: true, assignedAdminId: true },
  });
}

const loanNotificationSelect = {
  id: true,
  status: true,
  amount: true,
  approvedAmount: true,
  studentId: true,
  advisorId: true,
  assignedAdminId: true,
  student: { select: { fullNameTh: true } },
  advisor: { select: { email: true, roles: { select: { role: true } } } },
} satisfies Prisma.LoanRequestSelect;

export type LoanNotificationContext = Prisma.LoanRequestGetPayload<{
  select: typeof loanNotificationSelect;
}>;

/** Everything /api/notifications/fon needs, in one round-trip. */
export async function getLoanNotificationContext(
  loanId: string,
): Promise<LoanNotificationContext | null> {
  return prisma.loanRequest.findUnique({
    where: { id: loanId },
    select: loanNotificationSelect,
  });
}

/**
 * Resolves reviewer recipient emails for the given role on the given loan. Reuses the existing
 * admin/executive lookups so their fan-out rules (assigned admin, else all admin+super_admin;
 * the single executive) stay in one place.
 */
export async function resolveReviewerRecipients(
  role: ReviewerRole,
  loan: {
    advisor: { email: string; roles: { role: UserRoleName }[] };
    assignedAdminId: string | null;
  },
  db: DbClient = prisma,
): Promise<string[]> {
  if (role === "advisor") {
    const stillAdvisor = loan.advisor.roles.some(({ role }) => role === UserRoleName.advisor);
    return stillAdvisor ? [loan.advisor.email] : [];
  }
  if (role === "admin" || role === "super_admin") {
    return getAdminRecipientEmails(loan.assignedAdminId, db);
  }
  const executiveEmail = await getExecutiveRecipientEmail(db);
  return executiveEmail ? [executiveEmail] : [];
}

const installmentReminderSelect = {
  seq: true,
  dueDate: true,
  amountDue: true,
  amountPaid: true,
  settledAt: true,
  loanId: true,
  loan: {
    select: {
      status: true,
      student: { select: { fullNameTh: true, email: true } },
    },
  },
} satisfies Prisma.InstallmentSelect;

export type InstallmentReminderContext = Prisma.InstallmentGetPayload<{
  select: typeof installmentReminderSelect;
}>;

/**
 * The next unpaid installment for a loan - the caller (POST /api/notifications/outlook) only
 * supplies loanId; which installment is due, its amount, and its due date are computed here, not
 * accepted from the request. `seq` doubles as due-date order since installments are generated in
 * sequence 30 days apart (lib/loan-validation.ts computeInstallmentSchedule), so the lowest
 * unsettled seq is always the next one due.
 */
export async function getNextDueInstallmentContext(
  loanId: string,
): Promise<InstallmentReminderContext | null> {
  return prisma.installment.findFirst({
    where: { loanId, settledAt: null },
    orderBy: { seq: "asc" },
    select: installmentReminderSelect,
  });
}

/**
 * The specific installment a claimed outbox reminder was enqueued for - unlike
 * getNextDueInstallmentContext, this does not recompute "whichever is next due now", since that
 * can drift from what was actually claimed if the loan's installment state changed between
 * enqueue and delivery (e.g. an earlier installment got settled in between).
 */
export async function getInstallmentReminderContextById(
  installmentId: bigint,
): Promise<InstallmentReminderContext | null> {
  return prisma.installment.findUnique({
    where: { id: installmentId },
    select: installmentReminderSelect,
  });
}

/**
 * Enqueues one durable outbox row per reviewer recipient for a workflow transition. Call this
 * INSIDE the transaction that performed the transition, passing that transaction's client: the
 * rows then commit or roll back with the loan mutation, so a reviewer is never told about a
 * decision that did not happen, and never missed one that did.
 *
 * One row per recipient rather than one per event, because a partial failure must only retry the
 * recipients it failed for - retrying a whole event would re-notify everyone who already received
 * it. The dedupe key carries the audit-log row id, which is unique per transition, so a loan
 * legitimately re-entering a status enqueues afresh instead of colliding with the earlier one.
 *
 * A status with no reviewer step (disbursed, closed, rejected, cancelled, draft, returned) enqueues
 * nothing. Callers do not need to check first.
 */
export async function enqueueReviewerNotifications(
  tx: TxClient,
  input: { loanId: string; auditLogId: bigint },
): Promise<number> {
  const loan = await tx.loanRequest.findUnique({
    where: { id: input.loanId },
    select: loanNotificationSelect,
  });
  if (!loan) return 0;

  // Read on tx, so this is the status the enclosing transaction just wrote, not whatever a later
  // read outside it would observe.
  const step = REVIEWER_STEP_BY_STATUS[loan.status];
  if (!step) return 0;

  const recipients = await resolveReviewerRecipients(step.role, loan, tx);
  if (recipients.length === 0) {
    console.error(
      `No reviewer recipient resolved for loan ${input.loanId} at status ${loan.status}`,
    );
    return 0;
  }

  for (const recipientEmail of recipients) {
    await enqueueNotification(tx, {
      dedupeKey: `reviewer-notification:${input.auditLogId}:${recipientEmail}`,
      eventType: REVIEWER_NOTIFICATION_EVENT,
      payload: {
        loanId: input.loanId,
        status: loan.status,
        role: step.role,
        recipientEmail,
      },
    });
  }

  return recipients.length;
}

type ReviewerNotificationLoan = {
  id: string;
  status: string;
  amount: number;
  approvedAmount: number | null;
  student: { fullNameTh: string };
};

/**
 * Builds the deep link + per-recipient payload and delivers to every recipient independently
 * (one recipient's failure never blocks another's). Used by POST /api/notifications/fon, the
 * manual on-demand trigger, which sends inline so the operator sees a real result. The automatic
 * path does not come through here - it enqueues via enqueueReviewerNotifications and the
 * deliver-fon cron worker sends one claimed row at a time.
 */
export async function sendReviewerNotifications(
  step: ReviewerNotificationStep,
  loan: ReviewerNotificationLoan,
  recipients: string[],
): Promise<PromiseSettledResult<LineNotificationResponse>[]> {
  const deepLinkUrl = buildRequestUrlForPath(
    process.env.APP_BASE_URL ?? "http://localhost:8080",
    step.path,
    loan.id,
  );

  return Promise.allSettled(
    recipients.map((email) => {
      const payload = buildReviewerNotificationPayload({
        role: step.role,
        recipientEmail: email,
        requestId: loan.id,
        studentName: loan.student.fullNameTh,
        amount: loan.approvedAmount ?? loan.amount,
        eventLabel: step.eventLabel,
        deepLinkUrl,
      });
      return sendLineNotification(payload, {
        idempotencyKey: `${step.role}:${loan.id}:${loan.status}:${email}`,
      });
    }),
  );
}

