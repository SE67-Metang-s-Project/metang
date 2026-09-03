import type { LoanDecision } from "@/lib/loan-validation";

export type LoanRequestIdParams = {
  id: string;
};

export type AdvisorDecisionBody = {
  decision: LoanDecision;
  comment?: string | null;
};

export type AdminDecisionBody = {
  decision: LoanDecision;
  approvedAmount?: number;
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
    decider: {
      id: string;
      fullNameTh: string;
      fullNameEn: string | null;
    } | null;
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

export type AdminQueueItem = {
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
    phone: string | null;
  };
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
    decider: {
      id: string;
      fullNameTh: string;
      fullNameEn: string | null;
    } | null;
  }[];
};

export type AdminLoanRequestDetail = {
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
  status: AdvisorQueueItem["status"];
  submittedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  disbursedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  student: AdminQueueItem["student"];
  advisor: AdminQueueItem["advisor"];
  approvals: AdminQueueItem["approvals"];
};

export type AdminQueueResponse = {
  data: AdminQueueItem[];
};

export type AdminLoanRequestDetailResponse = {
  data: AdminLoanRequestDetail;
};

export type PhoneNumberBody = {
  phoneNumber: string;
};

export type PhoneNumberResponse = {
  data: { phone: string | null } | null;
};

export type ExecutiveDecisionBody =
  | { decision: "approved"; comment?: string | null }
  | { decision: "rejected"; comment: string };

export type ExecutiveQueueItem = {
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
    phone: string | null;
  };
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
    decider: {
      id: string;
      fullNameTh: string;
      fullNameEn: string | null;
    } | null;
  }[];
};

export type ExecutiveLoanRequestDetail = {
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
  status: ExecutiveQueueItem["status"];
  submittedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  disbursedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  student: ExecutiveQueueItem["student"];
  advisor: ExecutiveQueueItem["advisor"];
  approvals: ExecutiveQueueItem["approvals"];
};

export type ExecutiveQueueResponse = {
  data: ExecutiveQueueItem[];
};

export type ExecutiveLoanRequestDetailResponse = {
  data: ExecutiveLoanRequestDetail;
};

export type UserIdParams = {
  id: string;
};

export type PredefinedRoleName =
  | "student"
  | "advisor"
  | "admin"
  | "super_admin"
  | "executive";

export type RoleMutationBody = {
  action: "grant" | "remove";
  role: PredefinedRoleName;
};

export type SuperAdminUser = {
  id: string;
  email: string;
  cmuAccount: string;
  studentCode: string | null;
  fullNameTh: string;
  fullNameEn: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  roles: {
    role: PredefinedRoleName;
    grantedBy: string | null;
    grantedAt: string;
  }[];
};

export type SuperAdminUserListResponse = {
  data: {
    users: SuperAdminUser[];
    availableRoles: PredefinedRoleName[];
  };
};

export type SuperAdminUserResponse = {
  data: SuperAdminUser;
};
