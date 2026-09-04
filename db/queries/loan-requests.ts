import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { serializeJson } from "@/lib/serialization";
import type { ExecutiveDecision, LoanDecision } from "@/lib/loan-validation";


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
      slipUrl: true,
      slipRef: true,
      status: true,
      confirmedBy: true,
      confirmedAt: true,
      paidAt: true,
      createdAt: true,
    },
  },
} satisfies Prisma.LoanRequestSelect;

type AdvisorLoanRequest = Prisma.LoanRequestGetPayload<{ select: typeof advisorLoanSelect }>;
type GlobalLoanRequest = Prisma.LoanRequestGetPayload<{ select: typeof globalLoanSelect }>;

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
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
  }

  return prisma.loanRequest.findMany({
    select: globalLoanSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

export type AdvisorDecisionErrorCode = "NOT_FOUND" | "STALE_DECISION";

export class AdvisorDecisionError extends Error {
  constructor(readonly code: AdvisorDecisionErrorCode) {
    super(code);
  }
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

    const pending = await tx.loanApproval.findFirst({
      where: { loanId: id, step: "advisor", decision: "pending" },
      orderBy: { attempt: "desc" },
    });
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
      const latestAdmin = await tx.loanApproval.findFirst({
        where: { loanId: id, step: "admin" },
        orderBy: { attempt: "desc" },
        select: { attempt: true },
      });
      const attempt = (latestAdmin?.attempt ?? 0) + 1;
      await tx.loanApproval.create({ data: { loanId: id, step: "admin", attempt } });

    }

    const final = await tx.loanRequest.findUniqueOrThrow({
      where: { id },
      select: advisorLoanSelect,
    });
    await tx.auditLog.create({
      data: {
        actorId: advisorId,
        action: `loan_request.advisor_${decision}`,
        entityType: "loan_request",
        entityId: id,
        before: serializeJson(current),
        after: serializeJson(final),
      },
    });
    return final;
  });
}

export type AdminDecisionErrorCode =
  | "NOT_FOUND"
  | "STALE_DECISION"
  | "ACCESS_REVOKED"
  | "INVALID_APPROVED_AMOUNT"
  | "AMOUNT_EXCEEDS_REQUEST"
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

    const pending = await tx.loanApproval.findFirst({
      where: { loanId: id, step: "admin", decision: "pending" },
      orderBy: { attempt: "desc" },
    });
    if (!pending) throw new AdminDecisionError("STALE_DECISION");

    if (decision === "approved") {
      if (approvedAmount === null || approvedAmount <= 0 || !Number.isSafeInteger(approvedAmount)) {
        throw new AdminDecisionError("INVALID_APPROVED_AMOUNT");
      }
      if (approvedAmount > current.amount) {
        throw new AdminDecisionError("AMOUNT_EXCEEDS_REQUEST");
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
    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: `loan_request.admin_${decision}`,
        entityType: "loan_request",
        entityId: id,
        before: serializeJson(current),
        after: serializeJson(final),
      },
    });
    return final;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
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

    const pending = await tx.loanApproval.findFirst({
      where: { loanId: id, step: "executive", decision: "pending" },
      orderBy: { attempt: "desc" },
    });
    if (!pending) throw new ExecutiveDecisionError("STALE_DECISION");

    const nextStatus = decision === "approved" ? "pending_disbursement" : "pending_admin";
    const changed = await tx.loanRequest.updateMany({
      where: { id, status: "pending_executive" },
      data: {
        status: nextStatus,
        assignedAdminId: decision === "approved" ? null : current.assignedAdminId,
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
    await tx.auditLog.create({
      data: {
        actorId: executiveId,
        action: `loan_request.executive_${decision}`,
        entityType: "loan_request",
        entityId: id,
        before: serializeJson(current),
        after: serializeJson(final),
      },
    });
    return final;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
