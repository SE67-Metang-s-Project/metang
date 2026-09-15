import { prisma } from "@/lib/prisma";
import { Prisma, UserRoleName } from "@/lib/generated/prisma/client";
import type { ReviewerRole } from "@/lib/reviewer-deeplink";

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
