export type PaymentEvidence = {
  id: string;
  installmentNumber: number;
  amount: string;
  paidAt: string;
  verifiedAt?: string;
  status: "pending" | "verified" | "rejected";
  slipImageUrl: string;
  bankFrom?: string;
  bankTo?: string;
};

export type InstallmentPlan = {
  installmentNumber: number;
  dueDate: string;
  amount: string;
};

export type LoanTransaction = {
  id: string;
  studentId: string;
  studentName: string;
  major: string;
  year: string;
  submitDate: string;
  objective: string;
  remark: string;
  totalAmount: string;
  totalAmountText: string;
  term: number;
  overallStatus: string;
  installments: InstallmentPlan[];
  paymentHistory: PaymentEvidence[];
};