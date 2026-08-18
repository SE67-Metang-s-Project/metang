import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { serializeJson } from "@/lib/serialization";
import type { LoanDecision } from "@/lib/loan-validation";

export type LoanRequestVisibility =
  | { scope: "global" }
  | { scope: "assigned"; advisorId: string };

export const advisorLoanSelect = {
  id: true, studentId: true, advisorId: true, amount: true, approvedAmount: true,
  studentYear: true, purpose: true, additionalNote: true, installmentCount: true,
  firstDueDate: true, status: true, submittedAt: true, cancelledAt: true,
  cancelledBy: true, disbursedAt: true, closedAt: true, createdAt: true, updatedAt: true,
  student: { select: { id: true, studentCode: true, fullNameTh: true, fullNameEn: true } },
  advisor: { select: { id: true, fullNameTh: true, fullNameEn: true } },
  approvals: {
    include: { decider: { select: { id: true, fullNameTh: true, fullNameEn: true } } },
    orderBy: [{ step: "asc" }, { attempt: "asc" }],
  },
} satisfies Prisma.LoanRequestSelect;

const globalLoanInclude = {
  student: {
    select: {
      id: true,
      studentCode: true,
      fullNameTh: true,
      fullNameEn: true,
      phone: true,
    },
  },
  advisor: { select: { id: true, fullNameTh: true, fullNameEn: true } },
  cancelledByUser: { select: { id: true, fullNameTh: true, fullNameEn: true } },
  approvals: {
    include: { decider: { select: { id: true, fullNameTh: true, fullNameEn: true } } },
    orderBy: [{ step: "asc" }, { attempt: "asc" }],
  },
  installments: { orderBy: { seq: "asc" } },
  payments: { omit: { slipOcrRaw: true }, orderBy: { createdAt: "asc" } },
} satisfies Prisma.LoanRequestInclude;

type AdvisorLoanRequest = Prisma.LoanRequestGetPayload<{ select: typeof advisorLoanSelect }>;
type GlobalLoanRequest = Prisma.LoanRequestGetPayload<{ include: typeof globalLoanInclude }>;

export function getLoanRequests(visibility: { scope: "global" }): Promise<GlobalLoanRequest[]>;
export function getLoanRequests(visibility: { scope: "assigned"; advisorId: string }): Promise<AdvisorLoanRequest[]>;
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
    include: globalLoanInclude,
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
