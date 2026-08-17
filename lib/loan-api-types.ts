import type { LoanDecision } from "@/lib/loan-validation";

export type LoanRequestIdParams = {
  id: string;
};

export type AdvisorDecisionBody = {
  decision: LoanDecision;
  comment?: string | null;
};

export type LoanRequestDetail = {
  id: string;
  studentId: string;
  advisorId: string;
  amount: number;
  approvedAmount: number | null;
  studentYear: number;
  purpose: string;
  additionalNote: string | null;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
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
  advisor: {
    id: string;
    fullNameTh: string;
    fullNameEn: string | null;
  };
  approvals: {
    id: string;
    loanId: string;
    step: "advisor" | "admin" | "executive";
    attempt: number;
    decision: "pending" | "approved" | "returned" | "rejected";
    decidedBy: string | null;
    decidedAt: string | null;
    comment: string | null;
  }[];
};

export type LoanRequestDetailResponse = {
  data: LoanRequestDetail;
};

export type LoanRequestDetailListResponse = {
  data: LoanRequestDetail[];
};

export type LoanRequestCurrentResponse = {
  data: LoanRequestDetail | null;
};

export type AdvisorQueueItem = {
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
  student: {
    id: string;
    studentCode: string | null;
    fullNameTh: string;
    fullNameEn: string | null;
  };
  approvals: {
    id: string;
    loanId: string;
    step: "advisor" | "admin" | "executive";
    attempt: number;
    decision: "pending" | "approved" | "returned" | "rejected";
    decidedBy: string | null;
    decidedAt: string | null;
    comment: string | null;
  }[];
};

export type AdvisorLoanRequestDetail = {
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
  status: AdvisorQueueItem["status"];
  submittedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  disbursedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    studentCode: string | null;
    fullNameTh: string;
    fullNameEn: string | null;
  };
  advisor: {
    id: string;
    fullNameTh: string;
    fullNameEn: string | null;
  };
  approvals: AdvisorQueueItem["approvals"];
};

export type AdvisorLoanRequestDetailResponse = {
  data: AdvisorLoanRequestDetail;
};

export type AdvisorQueueResponse = {
  data: AdvisorQueueItem[];
};

export type PhoneNumberBody = {
  phoneNumber: string;
};

export type PhoneNumberResponse = {
  data: { phone: string | null } | null;
};
