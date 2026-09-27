import type { LoanDecision } from "@/lib/loan-validation";

export type LoanRequestIdParams = {
  id: string;
};

export type FundTransactionIdParams = {
  id: string;
};

export type PaymentIdParams = {
  id: string;
};

export type StudentPaymentBody = {
  /** Whole baht. */
  amount: number;
  /** ISO 8601. Defaults to now when omitted; never in the future. */
  paidAt?: string | null;
  /** The transfer slip: image/jpeg, image/png or application/pdf, up to 10MB. */
  slip: string;
};

export type StudentPaymentItem = {
  id: string;
  loanId: string;
  installmentId: string | null;
  amount: number;
  status: "pending_review" | "confirmed" | "rejected";
  /** The slip is read through GET /api/payments/{id}/slip; the storage path is never sent. */
  hasSlip: boolean;
  paidAt: string | null;
  confirmedAt: string | null;
  /** Why a reviewer rejected it, so a corrected slip can be sent. */
  reviewNote: string | null;
  createdAt: string;
};

export type StudentPaymentResponse = {
  data: StudentPaymentItem;
};

export type PaymentDecisionBody = {
  decision: "confirmed" | "rejected";
  note?: string | null;
};

/** Same shape for the queue and the detail - one select serves both. */
export type AdminPaymentItem = {
  id: string;
  loanId: string;
  installmentId: string | null;
  amount: number;
  status: "pending_review" | "confirmed" | "rejected";
  /** The slip is read through GET /api/payments/{id}/slip; the storage path is never sent. */
  hasSlip: boolean;
  paidAt: string | null;
  confirmedBy: string | null;
  confirmedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  loan: {
    id: string;
    status: AdvisorQueueItem["status"];
    student: {
      id: string;
      studentCode: string | null;
      fullNameTh: string;
      fullNameEn: string | null;
      phone: string | null;
    };
  };
  installment: {
    id: string;
    seq: number;
    dueDate: string;
    amountDue: number;
    amountPaid: number;
  } | null;
};

export type AdminPaymentQueueResponse = {
  data: AdminPaymentItem[];
};

export type AdminPaymentDetailResponse = {
  data: AdminPaymentItem;
};

export type AdvisorDecisionBody = {
  decision: LoanDecision;
  comment: string;
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
  fundTransactions: { id: string }[];
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
    createdAt: string;
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
  fundTransactions: { id: string }[];
};

export type AdminLoanQueueQuery = {
  status?: "pending_admin" | "pending_disbursement";
};

// Best-effort only: this route is multipart/form-data (a file field), not JSON, and
// next-openapi-gen has no multipart request-body model - the generated spec will still show
// this as a JSON schema. See app/api/admin/loan-requests/[id]/disburse/route.ts.
export type DisburseLoanRequestBody = {
  slip: string;
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
  | { decision: "returned"; comment: string }
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
    createdAt: string;
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

export type PredefinedRoleName = "student" | "advisor" | "admin" | "super_admin" | "executive";

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

export type FundLedgerKind =
  | "top_up"
  | "withdrawal"
  | "credit_adjustment"
  | "debit_adjustment"
  | "disbursement"
  | "repayment";

export type MutableFundTransactionKind =
  "top_up" | "withdrawal" | "credit_adjustment" | "debit_adjustment";

export type FundTransactionItem = {
  id: string;
  kind: FundLedgerKind;
  amount: number;
  direction: 1 | -1;
  loanId: string | null;
  performedBy: string;
  slipPath: string | null;
  note: string | null;
  createdAt: string;
};

export type FundTransactionListResponse = {
  data: {
    balance: number;
    transactions: FundTransactionItem[];
    pendingDisbursement: number;
  };
};

export type FundTransactionBody = {
  kind: MutableFundTransactionKind;
  amount: number;
  note?: string | null;
};

export type FundTransactionResponse = {
  data: FundTransactionItem;
};

// Partial patch - every key optional, one endpoint serves both settings tabs independently.
export type SystemSettingBody = {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  contactLocationTh?: string;
  contactLocationEn?: string | null;
  contactPhone?: string;
  contactExt?: string | null;
  contactEmail?: string;
};

export type SystemSettingItem = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  contactLocationTh: string;
  contactLocationEn: string | null;
  contactPhone: string;
  contactExt: string | null;
  contactEmail: string;
  updatedById: string | null;
  updatedAt: string;
};

export type SystemSettingResponse = {
  data: SystemSettingItem;
};

export type SystemSettingPublicFields = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  contactLocationTh: string;
  contactLocationEn: string | null;
  contactPhone: string;
  contactExt: string | null;
  contactEmail: string;
};

export type SystemSettingPublicResponse = {
  data: SystemSettingPublicFields;
};

export type ReviewerNotificationBody = {
  loanId: string;
};

export type ReviewerNotificationResponse = {
  data: {
    loanId: string;
    role: "advisor" | "admin" | "executive";
    sent: number;
    failed: number;
  };
};

export type LoanReminderBody = {
  loanId: string;
};

export type LoanReminderResponse = {
  data: {
    loanId: string;
    installmentSeq: number;
    amountDue: number;
    dueDate: string;
    sentTo: string;
  };
};
