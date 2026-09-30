import { prisma } from "@/lib/prisma";
import {
  Prisma,
  type ApprovalStep as LoanApprovalStep,
  type Decision,
  type LoanStatus,
} from "@/lib/generated/prisma/client";
import { serializeJson } from "@/lib/serialization";
import { computeInstallmentSchedule, type ExecutiveDecision, type LoanDecision } from "@/lib/loan-validation";
import {
  enqueueReviewerNotifications,
  enqueueStudentLoanOutcome,
} from "@/db/queries/notification-recipients";
import type { ActionRequest } from "@/components/shared/pending/RequestsCard";
import { pendingStatusFor, statusesForFilter, type QueueFilter, type QueueRole } from "@/lib/queue-filter";
import {
  conductFromRows,
  summarizeStudentConduct,
  toActionRequest,
  type ActionRequestRow,
  type ActionRequestView,
  type StudentConduct,
} from "@/lib/action-request-view";


export type LoanRequestVisibility = { scope: "global" } | { scope: "assigned"; advisorId: string };

const userSummarySelect = {
  id: true,
  fullNameTh: true,
  fullNameEn: true,
} satisfies Prisma.AppUserSelect;

const studentSummarySelect = {
  ...userSummarySelect,
  studentCode: true,
} satisfies Prisma.AppUserSelect;

const loanSummarySelect = {
  id: true,
  studentId: true,
  advisorId: true,
  amount: true,
  approvedAmount: true,
  studentYear: true,
  purpose: true,
  additionalNote: true,
  installmentCount: true,
  firstDueDate: true,
  status: true,
  submittedAt: true,
  cancelledAt: true,
  cancelledBy: true,
  disbursedAt: true,
  transferConfirmedAt: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LoanRequestSelect;

const advisorApprovalHistory = {
  select: {
    id: true,
    loanId: true,
    step: true,
    attempt: true,
    decision: true,
    decidedBy: true,
    decidedAt: true,
    comment: true,
    decider: { select: userSummarySelect },
  },
  orderBy: [{ step: "asc" }, { attempt: "asc" }],
} satisfies Prisma.LoanRequest$approvalsArgs;

const staffApprovalHistory = {
  select: {
    id: true,
    loanId: true,
    step: true,
    attempt: true,
    decision: true,
    decidedBy: true,
    decidedAt: true,
    comment: true,
    createdAt: true,
    decider: { select: userSummarySelect },
  },
  orderBy: [{ createdAt: "asc" }, { id: "asc" }],
} satisfies Prisma.LoanRequest$approvalsArgs;

const studentApprovalHistory = {
  select: {
    id: true,
    loanId: true,
    step: true,
    attempt: true,
    decision: true,
    decidedBy: true,
    decidedAt: true,
    comment: true,
  },
  orderBy: [{ step: "asc" }, { attempt: "asc" }],
} satisfies Prisma.LoanRequest$approvalsArgs;

export const studentLoanSelect = {
  ...loanSummarySelect,
  bankName: true,
  bankAccountNo: true,
  bankAccountName: true,
  advisor: { select: userSummarySelect },
  approvals: studentApprovalHistory,
} satisfies Prisma.LoanRequestSelect;

export const advisorLoanSelect = {
  ...loanSummarySelect,
  student: { select: studentSummarySelect },
  advisor: { select: userSummarySelect },
  approvals: advisorApprovalHistory,
} satisfies Prisma.LoanRequestSelect;

export const adminQueueSelect = {
  ...loanSummarySelect,
  student: { select: { ...studentSummarySelect, phone: true } },
  advisor: { select: userSummarySelect },
  approvals: staffApprovalHistory,
} satisfies Prisma.LoanRequestSelect;

export const adminLoanDetailSelect = {
  ...adminQueueSelect,
  bankName: true,
  bankAccountNo: true,
  bankAccountName: true,
  // At most one row, per fund_transaction_one_disbursement_per_loan. Only the id is exposed:
  // the slip is read through GET /api/fund-transactions/{id}/slip, never by storage path.
  fundTransactions: {
    where: { kind: "disbursement" as const },
    select: { id: true },
  },
} satisfies Prisma.LoanRequestSelect;

export const executiveLoanSelect = {
  ...adminQueueSelect,
} satisfies Prisma.LoanRequestSelect;

const executiveDecisionSelect = {
  ...executiveLoanSelect,
  assignedAdminId: true,
} satisfies Prisma.LoanRequestSelect;

const globalLoanSelect = {
  ...loanSummarySelect,
  student: {
    select: {
      ...studentSummarySelect,
      phone: true,
    },
  },
  advisor: { select: userSummarySelect },
  cancelledByUser: { select: userSummarySelect },
  approvals: {
    ...advisorApprovalHistory,
  },
  installments: {
    orderBy: { seq: "asc" },
    select: {
      id: true,
      loanId: true,
      seq: true,
      dueDate: true,
      amountDue: true,
      amountPaid: true,
      settledAt: true,
    },
  },
  payments: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      loanId: true,
      installmentId: true,
      amount: true,
      // Selected only to derive hasSlip below; withSlipFlag strips it before the row leaves this
      // module. The slip is read through GET /api/payments/{id}/slip, never by storage path.
      slipPath: true,
      status: true,
      confirmedBy: true,
      confirmedAt: true,
      paidAt: true,
      createdAt: true,
    },
  },
} satisfies Prisma.LoanRequestSelect;

/** Replaces a payment's storage path with a boolean, so callers can show a "view slip" control. */
export function withSlipFlag<T extends { slipPath: string | null }>({ slipPath, ...payment }: T) {
  return { ...payment, hasSlip: slipPath !== null };
}

type WithSlipFlag<T extends { payments: { slipPath: string | null }[] }> = Omit<T, "payments"> & {
  payments: ReturnType<typeof withSlipFlag<T["payments"][number]>>[];
};

type AdvisorLoanRequest = Prisma.LoanRequestGetPayload<{ select: typeof advisorLoanSelect }>;
type GlobalLoanRequest = WithSlipFlag<
  Prisma.LoanRequestGetPayload<{ select: typeof globalLoanSelect }>
>;

export function getLoanRequests(visibility: { scope: "global" }): Promise<GlobalLoanRequest[]>;
export function getLoanRequests(visibility: {
  scope: "assigned";
  advisorId: string;
}): Promise<AdvisorLoanRequest[]>;
export function getLoanRequests(
  visibility: LoanRequestVisibility,
): Promise<GlobalLoanRequest[] | AdvisorLoanRequest[]>;
export async function getLoanRequests(visibility: LoanRequestVisibility) {
  if (visibility.scope === "assigned") {
    return prisma.loanRequest.findMany({
      where: { advisorId: visibility.advisorId },
      select: advisorLoanSelect,
      orderBy: [
        { submittedAt: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
        { id: "desc" },
      ],
    });
  }

  const loans = await prisma.loanRequest.findMany({
    select: globalLoanSelect,
    orderBy: [
      { submittedAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
      { id: "desc" },
    ],
  });
  return loans.map((loan) => ({ ...loan, payments: loan.payments.map(withSlipFlag) }));
}

export type AdvisorDecisionErrorCode = "NOT_FOUND" | "STALE_DECISION";

export class AdvisorDecisionError extends Error {
  constructor(readonly code: AdvisorDecisionErrorCode) {
    super(code);
  }
}

function latestPendingApproval<T extends { step: LoanApprovalStep; decision: Decision; attempt: number }>(
  approvals: readonly T[],
  step: LoanApprovalStep,
) {
  return approvals
    .filter((approval) => approval.step === step && approval.decision === "pending")
    .reduce<T | null>(
      (latest, approval) => (latest && latest.attempt >= approval.attempt ? latest : approval),
      null,
    );
}

function nextAttempt(
  approvals: readonly { step: LoanApprovalStep; attempt: number }[],
  step: LoanApprovalStep,
) {
  return (
    approvals.reduce(
      (max, approval) => (approval.step === step && approval.attempt > max ? approval.attempt : max),
      0,
    ) + 1
  );
}

export async function decideLoanRequest({
  id,
  advisorId,
  decision,
  comment,
}: {
  id: string;
  advisorId: string;
  decision: LoanDecision;
  comment: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.loanRequest.findFirst({
      where: { id, advisorId },
      include: {
        advisor: { select: { id: true, fullNameTh: true, fullNameEn: true } },
        approvals: { orderBy: [{ step: "asc" }, { attempt: "asc" }] },
      },
    });
    if (!current) throw new AdvisorDecisionError("NOT_FOUND");
    if (current.status !== "pending_advisor") {
      throw new AdvisorDecisionError("STALE_DECISION");
    }

    const pending = latestPendingApproval(current.approvals, "advisor");
    if (!pending) throw new AdvisorDecisionError("STALE_DECISION");

    const nextStatus = decision === "approved" ? "pending_admin" : decision;
    const changed = await tx.loanRequest.updateMany({
      where: { id, advisorId, status: "pending_advisor" },
      data: { status: nextStatus },
    });
    if (changed.count !== 1) throw new AdvisorDecisionError("STALE_DECISION");

    await tx.loanApproval.update({
      where: { id: pending.id },
      data: { decision, decidedBy: advisorId, decidedAt: new Date(), comment },
    });
    if (decision === "approved") {
      const attempt = nextAttempt(current.approvals, "admin");
      await tx.loanApproval.create({ data: { loanId: id, step: "admin", attempt } });

    }

    const final = await tx.loanRequest.findUniqueOrThrow({
      where: { id },
      select: advisorLoanSelect,
    });
    const audit = await tx.auditLog.create({
      data: {
        actorId: advisorId,
        action: `loan_request.advisor_${decision}`,
        entityType: "loan_request",
        entityId: id,
        before: serializeJson(current),
        after: serializeJson(final),
      },
    });
    await enqueueReviewerNotifications(tx, { loanId: id, auditLogId: audit.id });
    if (nextStatus === "rejected") {
      await enqueueStudentLoanOutcome(tx, { loanId: id, outcome: "rejected" });
    }
    return final;
  });
}

export type AdminDecisionErrorCode =
  | "NOT_FOUND"
  | "STALE_DECISION"
  | "ACCESS_REVOKED"
  | "INVALID_APPROVED_AMOUNT"
  | "AMOUNT_EXCEEDS_REQUEST"
  | "AMOUNT_CHANGE_REQUIRED"
  | "RETURN_AFTER_EXECUTIVE_RETURN"
  | "REDUCTION_COMMENT_REQUIRED";

export class AdminDecisionError extends Error {
  constructor(readonly code: AdminDecisionErrorCode) {
    super(code);
  }
}

export async function decideAdminLoanRequest({
  id,
  adminId,
  decision,
  approvedAmount,
  comment,
}: {
  id: string;
  adminId: string;
  decision: LoanDecision;
  approvedAmount: number | null;
  comment: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const effectiveRole = await tx.userRole.findFirst({
      where: { userId: adminId, role: { in: ["admin", "super_admin"] } },
      select: { userId: true },
    });
    if (!effectiveRole) throw new AdminDecisionError("ACCESS_REVOKED");

    const current = await tx.loanRequest.findFirst({
      where: {
        id,
        status: "pending_admin",
        OR: [{ assignedAdminId: null }, { assignedAdminId: adminId }],
      },
      select: adminLoanDetailSelect,
    });
    if (!current) throw new AdminDecisionError("NOT_FOUND");

    const pending = latestPendingApproval(current.approvals, "admin");
    if (!pending) throw new AdminDecisionError("STALE_DECISION");

    // An executive return only asks the admin to change the amount; the loan never goes back to
    // the student after one, so the admin may approve a lower amount or reject, but not return.
    const wasReturnedByExecutive = current.approvals.some(
      (approval) => approval.step === "executive" && approval.decision === "returned",
    );
    if (wasReturnedByExecutive && decision === "returned") {
      throw new AdminDecisionError("RETURN_AFTER_EXECUTIVE_RETURN");
    }

    if (decision === "approved") {
      if (approvedAmount === null || approvedAmount <= 0 || !Number.isSafeInteger(approvedAmount)) {
        throw new AdminDecisionError("INVALID_APPROVED_AMOUNT");
      }
      if (approvedAmount > current.amount) {
        throw new AdminDecisionError("AMOUNT_EXCEEDS_REQUEST");
      }
      if (wasReturnedByExecutive && approvedAmount >= current.amount) {
        throw new AdminDecisionError("AMOUNT_CHANGE_REQUIRED");
      }
      if (approvedAmount < current.amount && !comment?.trim()) {
        throw new AdminDecisionError("REDUCTION_COMMENT_REQUIRED");
      }
    }

    const nextStatus = decision === "approved" ? "pending_executive" : decision;
    const changed = await tx.loanRequest.updateMany({
      where: {
        id,
        status: "pending_admin",
        OR: [{ assignedAdminId: null }, { assignedAdminId: adminId }],
      },
      data: {
        status: nextStatus,
        approvedAmount: decision === "approved" ? approvedAmount : null,
        assignedAdminId: decision === "approved" ? adminId : null,
      },
    });
    if (changed.count !== 1) throw new AdminDecisionError("STALE_DECISION");

    await tx.loanApproval.update({
      where: { id: pending.id },
      data: { decision, decidedBy: adminId, decidedAt: new Date(), comment },
    });

    if (decision === "approved") {
      await tx.loanApproval.create({
        data: { loanId: id, step: "executive", attempt: pending.attempt },
      });

    }

    const final = await tx.loanRequest.findUniqueOrThrow({
      where: { id },
      select: adminLoanDetailSelect,
    });
    const audit = await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: `loan_request.admin_${decision}`,
        entityType: "loan_request",
        entityId: id,
        before: serializeJson(current),
        after: serializeJson(final),
      },
    });
    await enqueueReviewerNotifications(tx, { loanId: id, auditLogId: audit.id });
    if (nextStatus === "rejected") {
      await enqueueStudentLoanOutcome(tx, { loanId: id, outcome: "rejected" });
    }
    return final;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 });
}

export type DisbursementErrorCode =
  | "NOT_FOUND"
  | "STALE_DECISION"
  | "ACCESS_REVOKED"
  | "DUPLICATE_DISBURSEMENT"
  | "INSUFFICIENT_FUNDS";

export class DisbursementError extends Error {
  constructor(readonly code: DisbursementErrorCode) {
    super(code);
  }
}

/**
 * Manual disbursement of a loan already approved and awaiting disbursement. slipPath must already
 * point at an uploaded object (see app/api/admin/loan-requests/[id]/disburse/route.ts) - the ledger
 * row is append-only and can never be updated with a slip path after insert.
 */
export async function disburseLoanRequest({
  id,
  adminId,
  slipPath,
}: {
  id: string;
  adminId: string;
  slipPath: string;
}) {
  return prisma.$transaction(async (tx) => {
    const effectiveRole = await tx.userRole.findFirst({
      where: { userId: adminId, role: { in: ["admin", "super_admin"] } },
      select: { userId: true },
    });
    if (!effectiveRole) throw new DisbursementError("ACCESS_REVOKED");

    const current = await tx.loanRequest.findFirst({
      where: { id, status: "pending_disbursement" },
      select: adminLoanDetailSelect,
    });
    if (!current) throw new DisbursementError("NOT_FOUND");
    if (current.approvedAmount === null) {
      // ponytail: state-machine invariant - executive approval always sets approvedAmount before
      // a loan reaches pending_disbursement. Guard exists only so TS narrows the type below.
      throw new Error(`Loan ${id} reached pending_disbursement without an approvedAmount`);
    }
    const approvedAmount = current.approvedAmount;

    try {
      await tx.fundTransaction.create({
        data: {
          kind: "disbursement",
          amount: approvedAmount,
          direction: -1,
          loanId: id,
          performedBy: adminId,
          slipPath,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new DisbursementError("DUPLICATE_DISBURSEMENT");
      }
      // The AFTER INSERT balance-guard trigger raises this exact message on check_violation.
      const insufficientFunds =
        error instanceof Error && error.message.includes("fund_transaction: insufficient balance");
      if (insufficientFunds) throw new DisbursementError("INSUFFICIENT_FUNDS");
      throw error;
    }

    const changed = await tx.loanRequest.updateMany({
      where: { id, status: "pending_disbursement" },
      data: { status: "disbursed", disbursedAt: new Date() },
    });
    if (changed.count !== 1) throw new DisbursementError("STALE_DECISION");

    const schedule = computeInstallmentSchedule(
      approvedAmount,
      current.installmentCount,
      current.firstDueDate,
    );
    await tx.installment.createMany({
      data: schedule.map((installment) => ({ loanId: id, ...installment })),
    });

    const final = await tx.loanRequest.findUniqueOrThrow({
      where: { id },
      select: adminLoanDetailSelect,
    });
    const audit = await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "loan_request.disbursed",
        entityType: "loan_request",
        entityId: id,
        before: serializeJson(current),
        after: serializeJson(final),
      },
    });
    // No-op today: "disbursed" has no reviewer step, so nothing is enqueued. Kept so a future
    // status gains coverage without another audit of every transition site.
    await enqueueReviewerNotifications(tx, { loanId: id, auditLogId: audit.id });
    await enqueueStudentLoanOutcome(tx, { loanId: id, outcome: "disbursed" });
    return final;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 });
}

export type AdminCancelErrorCode = "NOT_FOUND" | "STALE_DECISION" | "ACCESS_REVOKED";

export class AdminCancelError extends Error {
  constructor(readonly code: AdminCancelErrorCode) {
    super(code);
  }
}

/**
 * Cancel a loan request that is awaiting disbursement or awaiting admin approval.
 */
export async function cancelAdminLoanRequest({
  id,
  adminId,
  comment,
}: {
  id: string;
  adminId: string;
  comment: string;
}) {
  return prisma.$transaction(async (tx) => {
    const effectiveRole = await tx.userRole.findFirst({
      where: { userId: adminId, role: { in: ["admin", "super_admin"] } },
      select: { userId: true },
    });
    if (!effectiveRole) throw new AdminCancelError("ACCESS_REVOKED");

    const current = await tx.loanRequest.findFirst({
      where: {
        id,
        status: { in: ["pending_disbursement", "pending_admin"] },
      },
      select: adminLoanDetailSelect,
    });
    if (!current) throw new AdminCancelError("NOT_FOUND");

    const cancelledAt = new Date();
    const changed = await tx.loanRequest.updateMany({
      where: {
        id,
        status: { in: ["pending_disbursement", "pending_admin"] },
      },
      data: {
        status: "cancelled",
        cancelledAt,
        cancelledBy: adminId,
      },
    });
    if (changed.count !== 1) throw new AdminCancelError("STALE_DECISION");

    const pending = latestPendingApproval(current.approvals, "admin");
    if (pending) {
      await tx.loanApproval.update({
        where: { id: pending.id },
        data: {
          decision: "rejected",
          decidedBy: adminId,
          decidedAt: cancelledAt,
          comment,
        },
      });
    } else {
      const lastAttempt = current.approvals?.length
        ? Math.max(...current.approvals.map((a) => a.attempt))
        : 1;
      await tx.loanApproval.create({
        data: {
          loanId: id,
          step: "admin",
          attempt: lastAttempt,
          decision: "rejected",
          decidedBy: adminId,
          decidedAt: cancelledAt,
          comment,
        },
      });
    }

    const final = await tx.loanRequest.findUniqueOrThrow({
      where: { id },
      select: adminLoanDetailSelect,
    });

    const audit = await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "loan_request.cancelled",
        entityType: "loan_request",
        entityId: id,
        before: serializeJson(current),
        after: serializeJson(final),
      },
    });

    await enqueueReviewerNotifications(tx, { loanId: id, auditLogId: audit.id });
    await enqueueStudentLoanOutcome(tx, { loanId: id, outcome: "rejected" });

    return final;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 });
}


/**
 * Staff pages are Server Components that hand this result to client components, so every field
 * returned is serialized into the page. `view` names what the page's UI reads; the rest is neither
 * selected nor sent.
 */
async function loadActionRequests(
  where: Prisma.LoanRequestWhereInput,
  view: ActionRequestView,
  options: {
    distinctStudent?: boolean;
    conductFromRows?: boolean;
    page?: { skip: number; take: number };
  } = {},
): Promise<ActionRequest[]> {
  // Only when `where` covers every loan that can have installments (disbursed or closed), so the
  // rows already hold each student's repayment history and only the loan count is read separately.
  const readConductFromRows = view.conduct && view.schedule && options.conductFromRows === true;
  const [rows, loanTotals] = await Promise.all([
    prisma.loanRequest.findMany({
      where,
      ...(options.distinctStudent ? { distinct: ["studentId" as const] } : {}),
      ...(options.page ?? {}),
      select: {
        id: true,
        studentId: true,
        studentYear: true,
        purpose: true,
        amount: true,
        approvedAmount: true,
        installmentCount: true,
        status: true,
        submittedAt: true,
        createdAt: true,
        cancelledAt: true,
        ...(view.bank ? { bankName: true, bankAccountNo: true, bankAccountName: true } : {}),
        student: {
          select: { fullNameTh: true, studentCode: true, phone: true, educationLevel: true },
        },
        // Verify-slip shows no advisor, approvals or cancellation.
        ...(view.verifySlip
          ? {}
          : {
              advisor: { select: { fullNameTh: true } },
              cancelledByUser: { select: { fullNameTh: true } },
              approvals: {
                select: {
                  step: true,
                  decision: true,
                  comment: true,
                  decidedAt: true,
                  createdAt: true,
                  decider: { select: { fullNameTh: true } },
                },
                orderBy: [{ attempt: "asc" }, { id: "asc" }],
              },
            }),
        ...(view.schedule
          ? {
              installments: {
                select: {
                  id: true,
                  seq: true,
                  dueDate: true,
                  amountDue: true,
                  amountPaid: true,
                  settledAt: true,
                },
                orderBy: { seq: "asc" },
              },
              payments: {
                select: {
                  id: true,
                  installmentId: true,
                  status: true,
                  amount: true,
                  paidAt: true,
                  confirmedAt: true,
                  createdAt: true,
                  reviewNote: true,
                  slipPath: true,
                },
                orderBy: { createdAt: "asc" },
              },
            }
          : {}),
        // At most one row, per fund_transaction_one_disbursement_per_loan. Only the id is needed:
        // the slip is read through GET /api/fund-transactions/{id}/slip, never by storage path.
        ...(view.slipLinks && !view.verifySlip
          ? { fundTransactions: { where: { kind: "disbursement" as const }, select: { id: true } } }
          : {}),
      },
      orderBy: [
        { submittedAt: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
        { id: "desc" },
      ],
    }),
    readConductFromRows
      ? prisma.loanRequest.groupBy({
          by: ["studentId"],
          where: { student: { studentLoans: { some: where } } },
          _count: { _all: true },
        })
      : null,
  ]);

  // The conditional selects widen Prisma's inferred type to the whole model, so the row shape is
  // stated by ActionRequestRow and each select above is kept in step with it.
  const loans = rows as unknown as (ActionRequestRow & { studentId: string })[];
  const conductByStudent = !view.conduct
    ? new Map<string, StudentConduct>()
    : loanTotals
      ? conductFromRowsOf(loans, loanTotals)
      : await loadStudentConduct([...new Set(loans.map((loan) => loan.studentId))]);

  return loans.map((loan) => toActionRequest(loan, view, conductByStudent.get(loan.studentId)));
}

function conductFromRowsOf(
  rows: Parameters<typeof conductFromRows>[0],
  totals: { studentId: string; _count: { _all: number } }[],
) {
  return conductFromRows(
    rows,
    totals.map(({ studentId, _count }) => ({ studentId, count: _count._all })),
  );
}

/** One query per table for all the students on a page, instead of every loan of each student per row. */
async function loadStudentConduct(studentIds: string[]): Promise<Map<string, StudentConduct>> {
  if (studentIds.length === 0) return new Map();
  const loan = { studentId: { in: studentIds } };
  const [installments, payments, counts] = await Promise.all([
    prisma.installment.findMany({
      where: { loan },
      orderBy: { seq: "asc" },
      select: {
        loanId: true,
        seq: true,
        dueDate: true,
        settledAt: true,
        amountDue: true,
        amountPaid: true,
        loan: { select: { studentId: true } },
      },
    }),
    // Only confirmed payments count toward conduct; see deriveInstallmentConduct.
    prisma.payment.findMany({
      where: { status: "confirmed", loan },
      select: {
        loanId: true,
        status: true,
        amount: true,
        paidAt: true,
        confirmedAt: true,
        createdAt: true,
        loan: { select: { studentId: true } },
      },
    }),
    prisma.loanRequest.groupBy({ by: ["studentId"], where: loan, _count: { _all: true } }),
  ]);

  const byStudent = new Map<string, Map<string, { installments: typeof installments; payments: typeof payments }>>();
  const loanOf = (studentId: string, loanId: string) => {
    const loans = byStudent.get(studentId) ?? new Map();
    byStudent.set(studentId, loans);
    const entry = loans.get(loanId) ?? { installments: [], payments: [] };
    loans.set(loanId, entry);
    return entry;
  };
  for (const row of installments) loanOf(row.loan.studentId, row.loanId).installments.push(row);
  for (const row of payments) loanOf(row.loan.studentId, row.loanId).payments.push(row);

  return new Map(
    counts.map((count) => [
      count.studentId,
      summarizeStudentConduct([...(byStudent.get(count.studentId)?.values() ?? [])], count._count._all),
    ]),
  );
}

const unsettledInstallments = { some: { settledAt: null } } satisfies Prisma.InstallmentListRelationFilter;

/** Admin and SuperAdmin pages: the disburse and verify views also show the bank and slip links. */
const fullView: ActionRequestView = { bank: true, slipLinks: true, schedule: true, conduct: true };
const advisorView: ActionRequestView = { bank: false, slipLinks: false, schedule: true, conduct: true };

/**
 * A pending_admin loan assigned to another admin - an executive return goes back only to the admin
 * who forwarded it - is theirs alone: hidden from the queue, as in GET /api/admin/loan-requests,
 * and refused by decideAdminLoanRequest. SuperAdmins included. `viewerId` is the session user the
 * page has already authenticated, the identity the decide route acts as (dev bypass included).
 */
const assignedToViewerOrNoOne = (viewerId: string): Prisma.LoanRequestWhereInput[] => [
  { assignedAdminId: null },
  { assignedAdminId: viewerId },
];

/** /admin: only what the dashboard lists - queue, awaiting disbursement, slips to verify. */
export async function getAdminDashboardRequests(viewerId: string): Promise<ActionRequest[]> {
  return loadActionRequests(
    {
      OR: [
        { status: "pending_admin", OR: assignedToViewerOrNoOne(viewerId) },
        { status: "pending_disbursement" },
        { status: { in: ["disbursed", "closed"] }, payments: { some: { status: "pending_review" } } },
      ],
    },
    fullView,
  );
}

/** /admin/pending and /superadmin/pending. */
export async function getAdminQueueRequests(viewerId: string): Promise<ActionRequest[]> {
  return loadActionRequests(
    {
      status: { not: "draft" },
      OR: [{ status: { not: "pending_admin" } }, ...assignedToViewerOrNoOne(viewerId)],
    },
    fullView,
    { conductFromRows: true },
  );
}

const verifySlipView: ActionRequestView = {
  bank: false,
  slipLinks: true,
  schedule: true,
  conduct: false,
  verifySlip: true,
};
const verifySlipWhere: Prisma.LoanRequestWhereInput = {
  status: { in: ["disbursed", "closed"] },
  payments: { some: {} },
};

/** Verify-slip pages read payments, never the borrower's bank account or conduct. */
export async function getVerifySlipRequests(): Promise<ActionRequest[]> {
  return loadActionRequests(verifySlipWhere, verifySlipView);
}

// EXPERIMENT verify-slip-paging: one page of verify-slip loans, filtered by student name or code,
// for GET /api/admin/verify-slip. Revert with EXPERIMENT-verify-slip-paging.local.md.
export async function getVerifySlipPage({
  q,
  page,
  limit,
}: {
  q?: string;
  page: number;
  limit: number;
}): Promise<{ items: ActionRequest[]; total: number }> {
  const term = q?.trim();
  const where: Prisma.LoanRequestWhereInput = term
    ? {
        ...verifySlipWhere,
        OR: [
          { student: { fullNameTh: { contains: term, mode: "insensitive" } } },
          { student: { studentCode: { contains: term } } },
        ],
      }
    : verifySlipWhere;
  const [items, total] = await Promise.all([
    loadActionRequests(where, verifySlipView, { page: { skip: (page - 1) * limit, take: limit } }),
    prisma.loanRequest.count({ where }),
  ]);
  return { items, total };
}

// EXPERIMENT disburse-debt-paging: one page of disbursement loans for
// GET /api/admin/disburse-debt. Revert with EXPERIMENT-disburse-debt-paging.local.md.
const disbursementStatusesByTab = {
  all: ["pending_disbursement", "disbursed", "closed"],
  pending: ["pending_disbursement"],
  done: ["disbursed", "closed"],
} as const;
export type DisbursementTab = keyof typeof disbursementStatusesByTab;
export const isDisbursementTab = (value: string): value is DisbursementTab =>
  Object.hasOwn(disbursementStatusesByTab, value);

export async function getDisbursementPage({
  tab,
  q,
  degree,
  page,
  limit,
}: {
  tab: DisbursementTab;
  q?: string;
  degree?: string;
  page: number;
  limit: number;
}): Promise<{ items: ActionRequest[]; total: number }> {
  const term = q?.trim();
  const where: Prisma.LoanRequestWhereInput = {
    status: { in: [...disbursementStatusesByTab[tab]] },
    ...(term
      ? {
          OR: [
            { student: { fullNameTh: { contains: term, mode: "insensitive" } } },
            { student: { studentCode: { contains: term } } },
          ],
        }
      : {}),
    ...(degree ? { student: { educationLevel: degree } } : {}),
  };
  const [items, total] = await Promise.all([
    loadActionRequests(where, fullView, { page: { skip: (page - 1) * limit, take: limit } }),
    prisma.loanRequest.count({ where }),
  ]);
  return { items, total };
}

// EXPERIMENT server-paging (revert: EXPERIMENT-server-paging.local.md)
// One page of a staff queue: the "pending" / "approved" / status filters and the search the lists
// used to apply to the whole array, plus the badge counts they took from it. `base` is what the
// role may see at all (assignment rule, no drafts); filters and search narrow it.
const executiveView: ActionRequestView = { bank: false, slipLinks: true, schedule: true, conduct: true };

export type QueuePageParams = {
  filter: QueueFilter;
  q?: string;
  page: number;
  limit: number;
  /** ?requestId= deep link: put this loan on the first page even if it would fall elsewhere. */
  focusId?: string;
};
export type QueuePage = {
  items: ActionRequest[];
  total: number;
  counts: { pending: number; pendingExecutive: number };
};

async function getQueuePage(
  base: Prisma.LoanRequestWhereInput,
  role: QueueRole,
  view: ActionRequestView,
  { filter, q, page, limit, focusId }: QueuePageParams,
): Promise<QueuePage> {
  const statuses = statusesForFilter(role, filter);
  const term = q?.trim();
  const where: Prisma.LoanRequestWhereInput = {
    AND: [
      base,
      ...(statuses ? [{ status: { in: statuses as LoanStatus[] } }] : []),
      ...(term
        ? [
            {
              OR: [
                { student: { fullNameTh: { contains: term, mode: "insensitive" as const } } },
                { student: { studentCode: { contains: term } } },
                { id: { contains: term, mode: "insensitive" as const } },
                { purpose: { contains: term, mode: "insensitive" as const } },
              ],
            },
          ]
        : []),
    ],
  };
  const [items, total, byStatus] = await Promise.all([
    loadActionRequests(where, view, { page: { skip: (page - 1) * limit, take: limit } }),
    prisma.loanRequest.count({ where }),
    prisma.loanRequest.groupBy({ by: ["status"], where: base, _count: { _all: true } }),
  ]);
  const countOf = (status: string) => byStatus.find((row) => row.status === status)?._count._all ?? 0;
  const focus =
    focusId && page === 1 && !items.some((item) => item.id === focusId)
      ? await loadActionRequests({ AND: [base, { id: focusId }] }, view)
      : [];
  return {
    items: [...focus, ...items],
    total,
    counts: { pending: countOf(pendingStatusFor(role)), pendingExecutive: countOf("pending_executive") },
  };
}

export async function getAdminQueuePage(viewerId: string, params: QueuePageParams): Promise<QueuePage> {
  return getQueuePage(
    {
      status: { not: "draft" },
      OR: [{ status: { not: "pending_admin" } }, ...assignedToViewerOrNoOne(viewerId)],
    },
    "admin",
    fullView,
    params,
  );
}

export async function getExecutiveQueuePage(params: QueuePageParams): Promise<QueuePage> {
  return getQueuePage({ status: { not: "draft" } }, "executive", executiveView, params);
}

export async function getAdvisorQueuePage(advisorId: string, params: QueuePageParams): Promise<QueuePage> {
  return getQueuePage({ advisorId, status: { not: "draft" } }, "advisor", advisorView, params);
}

export const STUDENT_TABS = ["all", "on_time", "late"] as const;
export type StudentTab = (typeof STUDENT_TABS)[number];
export const isStudentTab = (value: string): value is StudentTab =>
  (STUDENT_TABS as readonly string[]).includes(value);

// The degree filter reads the fifth digit of the student code, as the list did in the browser.
const DEGREE_CODE_DIGIT: Record<string, string> = {
  "ประกาศนียบัตรผู้ช่วยพยาบาล": "0",
  "ปริญญาตรี": "1",
  "ปริญญาโท": "3",
  "ปริญญาเอก": "5",
};
export const isStudentDegree = (value: string) => Object.hasOwn(DEGREE_CODE_DIGIT, value);

/**
 * One page of the students still repaying. Punctuality (on time / late) comes from repayment
 * conduct, which the database does not hold, so the small student set (one row per student) is
 * loaded, filtered here, then sliced.
 */
export async function getStudentsPage(
  scope: { advisorId: string } | "all",
  {
    tab,
    q,
    degree,
    page,
    limit,
  }: { tab: StudentTab; q?: string; degree?: string; page: number; limit: number },
): Promise<{ items: ActionRequest[]; total: number }> {
  const students = scope === "all" ? await getExecutiveStudentRequests() : await getAdvisorStudentRequests(scope.advisorId);
  const term = q ?? "";
  const digit = degree ? DEGREE_CODE_DIGIT[degree] : undefined;
  const matching = students.filter((student) => {
    if (!student.name.includes(term) && !student.studentId.includes(term)) return false;
    if (digit && student.studentId.charAt(4) !== digit) return false;
    const late = (student.paymentBehavior?.lateInstallments ?? 0) > 0;
    return tab === "all" || (tab === "late" ? late : !late);
  });
  return { items: matching.slice((page - 1) * limit, page * limit), total: matching.length };
}

export async function getDisbursementActionRequests(): Promise<ActionRequest[]> {
  return loadActionRequests({ status: { in: ["pending_disbursement", "disbursed", "closed"] } }, fullView, {
    conductFromRows: true,
  });
}

/** /advisor: the pending queue and the students still repaying. */
export async function getAdvisorDashboardRequests(advisorId: string): Promise<ActionRequest[]> {
  return loadActionRequests(
    {
      advisorId,
      OR: [{ status: "pending_advisor" }, { status: "disbursed", installments: unsettledInstallments }],
    },
    { ...advisorView, slipLinks: true },
  );
}

export async function getAdvisorActionRequests(advisorId: string): Promise<ActionRequest[]> {
  return loadActionRequests({ advisorId, status: { not: "draft" } }, advisorView);
}

/** Disbursed loans with a balance left, one per student: what filterAdvisorStudents used to cut. */
export async function getAdvisorStudentRequests(advisorId: string): Promise<ActionRequest[]> {
  return loadActionRequests(
    { advisorId, status: "disbursed", installments: unsettledInstallments },
    { ...advisorView, slipLinks: true },
    { distinctStudent: true },
  );
}

export async function getExecutiveActionRequests(): Promise<ActionRequest[]> {
  return loadActionRequests(
    { status: { not: "draft" } },
    { bank: false, slipLinks: true, schedule: true, conduct: true },
    { conductFromRows: true },
  );
}

export async function getExecutiveStudentRequests(): Promise<ActionRequest[]> {
  return loadActionRequests(
    { status: "disbursed", installments: unsettledInstallments },
    { bank: false, slipLinks: true, schedule: true, conduct: true },
    { distinctStudent: true },
  );
}

// System-wide total, unlike the Admin queue above: no assignedAdminId filter, for SuperAdmin's
// fund overview.
export async function getPendingDisbursementTotal(): Promise<number> {
  const result = await prisma.loanRequest.aggregate({
    where: { status: "pending_disbursement" },
    _sum: { approvedAmount: true },
  });
  return result._sum.approvedAmount ?? 0;
}

export const studentLoanDetailSelect = {
  ...studentLoanSelect,
  // At most one row, per fund_transaction_one_disbursement_per_loan. Only the id is exposed:
  // the slip is read through GET /api/fund-transactions/{id}/slip, never by storage path.
  fundTransactions: {
    where: { kind: "disbursement" as const },
    select: { id: true },
  },
  approvals: {
    select: {
      id: true,
      loanId: true,
      step: true,
      attempt: true,
      decision: true,
      decidedBy: true,
      decidedAt: true,
      comment: true,
      decider: { select: userSummarySelect },
    },
    orderBy: [{ step: "asc" }, { attempt: "asc" }],
  },
  installments: {
    select: {
      id: true,
      seq: true,
      dueDate: true,
      amountDue: true,
      amountPaid: true,
      settledAt: true,
    },
    orderBy: { seq: "asc" },
  },
  payments: {
    select: {
      id: true,
      installmentId: true,
      amount: true,
      // Selected only to derive hasSlip; a student reads their own slip through
      // GET /api/payments/{id}/slip, never by storage path.
      slipPath: true,
      status: true,
      paidAt: true,
      confirmedAt: true,
      // The reviewer's reason for a rejection - the student needs it to send a corrected slip.
      reviewNote: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.LoanRequestSelect;

type StudentLoanRow = Prisma.LoanRequestGetPayload<{ select: typeof studentLoanDetailSelect }>;

const withStudentSlipFlags = (loan: StudentLoanRow): WithSlipFlag<StudentLoanRow> => ({
  ...loan,
  payments: loan.payments.map(withSlipFlag),
});

export async function getStudentLoanList(studentId: string) {
  const loans = await prisma.loanRequest.findMany({
    where: { studentId },
    select: studentLoanDetailSelect,
    orderBy: { createdAt: "desc" },
  });
  return serializeJson(loans.map(withStudentSlipFlags));
}

export async function getStudentCurrentLoan(studentId: string) {
  const loan = await prisma.loanRequest.findFirst({
    where: {
      studentId,
      status: { notIn: ["closed", "rejected", "cancelled"] },
    },
    select: studentLoanDetailSelect,
    orderBy: { createdAt: "desc" },
  });
  return loan ? serializeJson(withStudentSlipFlags(loan)) : null;
}

export async function getStudentLoanDetail(loanId: string, studentId: string) {
  const loan = await prisma.loanRequest.findFirst({
    where: {
      id: loanId,
      studentId,
    },
    select: studentLoanDetailSelect,
  });
  return loan ? serializeJson(withStudentSlipFlags(loan)) : null;
}

export type ExecutiveDecisionErrorCode = "NOT_FOUND" | "STALE_DECISION" | "MISSING_ADMIN_ASSIGNMENT";

export class ExecutiveDecisionError extends Error {
  constructor(readonly code: ExecutiveDecisionErrorCode) {
    super(code);
  }
}

export async function decideExecutiveLoanRequest({
  id,
  executiveId,
  decision,
  comment,
}: {
  id: string;
  executiveId: string;
  decision: ExecutiveDecision;
  comment: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const effectiveRole = await tx.userRole.findFirst({
      where: { userId: executiveId, role: "executive" },
      select: { userId: true },
    });
    if (!effectiveRole) throw new ExecutiveDecisionError("NOT_FOUND");

    const current = await tx.loanRequest.findUnique({ where: { id }, select: executiveDecisionSelect });
    if (!current) throw new ExecutiveDecisionError("NOT_FOUND");
    if (current.status !== "pending_executive") {
      throw new ExecutiveDecisionError("STALE_DECISION");
    }
    if (!current.assignedAdminId) {
      throw new ExecutiveDecisionError("MISSING_ADMIN_ASSIGNMENT");
    }

    const pending = latestPendingApproval(current.approvals, "executive");
    if (!pending) throw new ExecutiveDecisionError("STALE_DECISION");

    const nextStatus =
      decision === "approved" ? "pending_disbursement" : decision === "returned" ? "pending_admin" : "rejected";
    const changed = await tx.loanRequest.updateMany({
      where: { id, status: "pending_executive" },
      data: {
        status: nextStatus,
        assignedAdminId: decision === "returned" ? current.assignedAdminId : null,
        approvedAmount: decision === "returned" ? null : undefined,
      },
    });
    if (changed.count !== 1) throw new ExecutiveDecisionError("STALE_DECISION");

    await tx.loanApproval.update({
      where: { id: pending.id },
      data: { decision, decidedBy: executiveId, decidedAt: new Date(), comment },
    });

    if (decision === "returned") {
      await tx.loanApproval.create({
        data: { loanId: id, step: "admin", attempt: pending.attempt + 1 },
      });
    }

    const final = await tx.loanRequest.findUniqueOrThrow({
      where: { id },
      select: executiveLoanSelect,
    });
    const audit = await tx.auditLog.create({
      data: {
        actorId: executiveId,
        action: `loan_request.executive_${decision}`,
        entityType: "loan_request",
        entityId: id,
        before: serializeJson(current),
        after: serializeJson(final),
      },
    });
    // New coverage: the executive path never notified anyone before, so pending_disbursement
    // starts being announced to admins from here.
    await enqueueReviewerNotifications(tx, { loanId: id, auditLogId: audit.id });
    if (nextStatus === "rejected") {
      await enqueueStudentLoanOutcome(tx, { loanId: id, outcome: "rejected" });
    }
    return final;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 });
}
