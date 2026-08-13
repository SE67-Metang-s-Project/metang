export type InstallmentStatus = "paid" | "current" | "upcoming";

export type InstallmentPayment = {
  installmentNumber: number;
  status: InstallmentStatus;
  paidAmountSummary: string;
  dueDateLabel: string;
  outstandingAmount: string;
  paymentNote?: string;
  completedPaymentDateLabel?: string;
  completedPaymentTimeLabel?: string;
  actionLabel?: string;
};

export type LoanRequestStatus = "pending" | "rejected";

export type LoanRequestHistoryItem = {
  requestNumber: string;
  statusLabel: string;
  statusType: LoanRequestStatus;
  submittedAt: string;
  amountLabel: string;
  amount: string;
};

export const studentProfile = {
  displayName: "นางสาวอนุชนก",
  programName: "พยาบาลศาสตรบัณฑิต",
  yearLabel: "ชั้นปีที่ 3",
  studentId: "661215001",
  initials: "MT",
};

export const activeLoan = {
  requestNumber: "SL-2568-0001",
  statusLabel: "กำลังผ่อนชำระ",
  paidAmount: "฿2,500",
  totalAmount: "฿3,000",
  progressPercent: 83,
  nextInstallmentNumber: 2,
  nextDueDate: "18 ก.พ. 2570",
};

export const paymentBehavior = {
  onTimeStatusLabel: "ชำระตรงเวลา",
  onTimeInstallments: 12,
  totalLoanRequests: 4,
  totalInstallments: 12,
};

export const installmentPayments: InstallmentPayment[] = [
  {
    installmentNumber: 1,
    status: "paid",
    paidAmountSummary: "฿1,000 / ฿1,000",
    dueDateLabel: "19 ม.ค. 2570",
    outstandingAmount: "฿0",
    completedPaymentDateLabel: "7 ม.ค. 2570",
    completedPaymentTimeLabel: "17:00 น.",
  },
  {
    installmentNumber: 2,
    status: "current",
    paidAmountSummary: "฿300 / ฿1,000",
    dueDateLabel: "18 ก.พ. 2570",
    outstandingAmount: "฿700",
    paymentNote: "อีก 15 วันครบกำหนด",
    actionLabel: "ชำระงวดนี้ · คงเหลือ ฿700",
  },
  {
    installmentNumber: 3,
    status: "upcoming",
    paidAmountSummary: "฿500 / ฿1,000",
    dueDateLabel: "20 มี.ค. 2570",
    outstandingAmount: "฿500",
    paymentNote: "อีก 45 วันครบกำหนด",
    actionLabel: "โปรดชำระงวดก่อนหน้าให้เสร็จสิ้น",
  },
];

export const loanRequestHistory: LoanRequestHistoryItem[] = [
  {
    requestNumber: "SL-2568-0001",
    statusLabel: "อยู่ระหว่างชำระคืน",
    statusType: "pending",
    submittedAt: "ยื่นเมื่อ 18 ธ.ค. 2569 10:00 น.",
    amountLabel: "ชำระแล้ว",
    amount: "฿2,000/฿3,000",
  },
  {
    requestNumber: "SL-2568-0001",
    statusLabel: "ปฏิเสธโดย · อาจารย์ที่ปรึกษา",
    statusType: "rejected",
    submittedAt: "ยื่นเมื่อ 18 ธ.ค. 2569 10:00 น.",
    amountLabel: "จำนวนที่ขอกู้",
    amount: "฿3,000",
  },
];
