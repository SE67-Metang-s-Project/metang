import { prisma } from "@/lib/prisma";
import { Prisma, UserRoleName } from "@/lib/generated/prisma/client";
import { type ReviewerRole, buildRequestUrlForPath } from "@/lib/reviewer-deeplink";
import {
  REVIEWER_STEP_BY_STATUS,
  buildReviewerNotificationPayload,
  type ReviewerNotificationStep,
} from "@/lib/line-notification-template";
import {
  LineNotificationError,
  sendLineNotification,
  type LineNotificationResponse,
} from "@/lib/line-notification";

export async function getAdvisorRecipientEmail(advisorId: string): Promise<string> {
  const user = await prisma.appUser.findUniqueOrThrow({
    where: { id: advisorId },
    select: { email: true },
  });
  return user.email;
}

export async function getAdminRecipientEmails(assignedAdminId: string | null): Promise<string[]> {
  if (assignedAdminId) {
    const user = await prisma.appUser.findUniqueOrThrow({
      where: { id: assignedAdminId },
      select: { email: true },
    });
    return [user.email];
  }

  const users = await prisma.appUser.findMany({
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

export async function getExecutiveRecipientEmail(): Promise<string | null> {
  const user = await prisma.appUser.findFirst({
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
  advisor: { select: { email: true } },
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
  loan: { advisor: { email: string }; assignedAdminId: string | null },
): Promise<string[]> {
  if (role === "advisor") return [loan.advisor.email];
  if (role === "admin" || role === "super_admin") {
    return getAdminRecipientEmails(loan.assignedAdminId);
  }
  const executiveEmail = await getExecutiveRecipientEmail();
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

type ReviewerNotificationLoan = {
  id: string;
  status: string;
  amount: number;
  approvedAmount: number | null;
  student: { fullNameTh: string };
};

/**
 * Builds the deep link + per-recipient payload and delivers to every recipient independently
 * (one recipient's failure never blocks another's). Shared by notifyLoanReviewer (the automatic
 * producer, below) and POST /api/notifications/fon (the manual on-demand trigger) so the two
 * never drift apart on message shape, deep-link construction, or idempotency-key format.
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

/**
 * Notify whichever reviewer is now waiting on `loanId`, based on its CURRENT status (re-fetched
 * here, not passed in - the caller may be several steps removed from the status change). A no-op
 * for any status with no reviewer step (REVIEWER_STEP_BY_STATUS), e.g. "rejected"/"returned".
 *
 * Call this AFTER the workflow mutation's transaction has committed, never from inside one -
 * this makes network calls, and a stalled/failed FON delivery must never roll back or delay the
 * loan decision it is announcing. Every failure is caught and logged here, never thrown, so a
 * caller never needs its own try/catch around this call.
 */
export async function notifyLoanReviewer(loanId: string): Promise<void> {
  try {
    const loan = await getLoanNotificationContext(loanId);
    if (!loan) return;

    const step = REVIEWER_STEP_BY_STATUS[loan.status];
    if (!step) return;

    const recipients = await resolveReviewerRecipients(step.role, loan);
    if (recipients.length === 0) {
      console.error(`No reviewer recipient resolved for loan ${loanId} at status ${loan.status}`);
      return;
    }

    const results = await sendReviewerNotifications(step, loan, recipients);

    const failures = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    if (failures.length > 0) {
      const messages = failures.map((f) =>
        f.reason instanceof LineNotificationError ? f.reason.message : String(f.reason),
      );
      console.error(
        `Unable to notify ${failures.length}/${recipients.length} reviewer(s) for loan ${loanId}`,
        messages,
      );
    }
  } catch (error) {
    console.error(`Unable to notify reviewer for loan ${loanId}`, error);
  }
}
