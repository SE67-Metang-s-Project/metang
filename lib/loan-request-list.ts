import type { UserRoleName } from "@/lib/generated/prisma/client";

export type LoanListAccess = "all" | "assigned" | "denied";

const globalLoanListRoles: readonly UserRoleName[] = ["admin", "super_admin", "executive"];

export function getLoanListAccess(roles: readonly UserRoleName[]): LoanListAccess {
  if (roles.some((role) => globalLoanListRoles.includes(role))) return "all";
  return roles.includes("advisor") ? "assigned" : "denied";
}

export type LoanRequestListUser = {
  id: string;
  fullNameTh: string;
  fullNameEn: string | null;
};

export type LoanRequestListStudent = {
  id: string;
  fullNameTh: string;
  fullNameEn: string | null;
  studentCode: string | null;
  phone: string | null;
};

export type LoanRequestListApproval = {
  id: string;
  loanId: string;
  step: "advisor" | "admin" | "executive";
  attempt: number;
  decision: "pending" | "approved" | "returned" | "rejected";
  decidedBy: string | null;
  decidedAt: string | null;
  comment: string | null;
  decider: LoanRequestListUser | null;
};

export type LoanRequestListInstallment = {
  id: string;
  loanId: string;
  seq: number;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  settledAt: string | null;
};

export type LoanRequestListPayment = {
  id: string;
  loanId: string;
  installmentId: string | null;
  amount: number;
  slipUrl: string | null;
  slipRef: string | null;
  status: string;
  confirmedBy: string | null;
  confirmedAt: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type LoanRequestListItem = {
  id: string;
  studentId: string;
  advisorId: string;
  amount: number;
  approvedAmount: number | null;
  studentYear: number;
  purpose: string;
  additionalNote: string | null;
  installmentCount: number;
  firstDueDate: string;
  status:
    | "draft"
    | "returned"
    | "pending_advisor"
    | "pending_admin"
    | "pending_executive"
    | "pending_disbursement"
    | "disbursed"
    | "closed"
    | "rejected"
    | "cancelled";
  submittedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  disbursedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  student: LoanRequestListStudent;
  advisor: LoanRequestListUser;
  cancelledByUser: LoanRequestListUser | null;
  approvals: LoanRequestListApproval[];
  installments: LoanRequestListInstallment[];
  payments: LoanRequestListPayment[];
};

export type LoanRequestListResponse = {
  data: LoanRequestListItem[];
};
