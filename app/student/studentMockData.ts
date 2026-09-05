export type InstallmentStatus = "paid" | "current" | "upcoming";

export type InstallmentPayment = {
  installmentNumber: number;
  status: InstallmentStatus;
  paidAmountSummary: string;
  dueDateLabel: string;
  outstandingAmount: string;
  paymentNote?: string;
  completedPaymentLabel?: string;
  completedPaymentDateLabel?: string;
  completedPaymentTimeLabel?: string;
  actionLabel?: string;
};

export type PaymentAccount = {
  bankLabel: string;
  bankName: string;
  accountNameLabel: string;
  accountName: string;
  accountNumberLabel: string;
  accountNumber: string;
  qrTitle: string;
  qrImageSrc: string;
  qrRecipientName: string;
  qrAccountName: string;
  qrReference: string;
};

export type LoanRequestStatus =
  | "pending"
  | "rejectedExecutive"
  | "waitingPaymentConfirmation"
  | "revisionRequired"
  | "waitingAdvisorApproval"
  | "waitingExecutiveApproval"
  | "waitingDocumentReview"
  | "completed";

export type LoanRequestHistoryItem = {
  requestNumber: string;
  statusLabel: string;
  statusType: LoanRequestStatus;
  submittedAt: string;
  purpose: string;
  amountLabel: string;
  amount: string;
};

export type LoanTimelineItem = {
  title: string;
  dateTime: string;
  actor: string;
  commentTitle?: string;
  comment?: string;
  isCompleted?: boolean;
  transferDetails?: string[];
};

export type LoanScheduleItem = {
  installmentNumber: number;
  dueDateLabel: string;
  amount: string;
};

export type LoanPaymentHistoryItem = {
  installmentNumber: number;
  amount: string;
  receiptImage: string;
  paidAt: string;
  checkedAt: string;
  statusLabel: string;
  status: "verified" | "checking" | "failed";
};

export type LoanContact = {
  phone: string;
  email: string;
  location: string;
  openingHours: string;
};

export type LoanDetails = {
  requestNumber: string;
  statusLabel: string;
  submittedAt: string;
  purposeLabel: string;
  purpose: string;
  amountLabel: string;
  amount: string;
  additionalReasonLabel: string;
  additionalReason: string;
  downloadLabel: string;
  transferSlipImage: string;
  timeline: LoanTimelineItem[];
  schedule: LoanScheduleItem[];
  paymentHistory: LoanPaymentHistoryItem[];
  contact: LoanContact;
};

export const loanContact: LoanContact = {
  phone: "053-935025",
  email: "loan@nurse.cmu.ac.th",
  location: "ชั้น 1 อาคารเทพรัตน์ คณะพยาบาลศาสตร์ มช.",
  openingHours: "จันทร์-ศุกร์ 08:30 - 16:30 น.",
};

export const studentProfile = {
  displayName: "นางสาวอนุชนก มีโชค",
  programName: "พยาบาลศาสตรบัณฑิต",
  // This student has submitted a loan application before, so their saved education level is shown.
  educationLevel: "ปริญญาตรี",
  yearLabel: "ปี 3",
  studentId: "661215001",
  initials: "MT",
};

export const activeLoan = {
  requestNumber: "SL-2568-0001",
  statusLabel: "อยู่ระหว่างชำระคืน",
  paidAmount: "2,500",
  totalAmount: "3,000",
  progressPercent: 83,
  nextInstallmentNumber: 2,
  nextDueDate: "18 ก.พ. 2570",
};

export const paymentBehavior = {
  onTimeStatusLabel: "ชำระตรงเวลา",
  onTimeInstallments: 12,
  lateInstallments: 0,
  totalLoanRequests: 4,
  totalInstallments: 12,
};

export const paymentAccount: PaymentAccount = {
  bankLabel: "ธนาคาร",
  bankName: "ธนาคารกรุงไทย",
  accountNameLabel: "ชื่อบัญชี",
  accountName: "คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่",
  accountNumberLabel: "เลขที่บัญชี",
  accountNumber: "1234567890",
  qrTitle: "THAI QR PAYMENT",
  qrImageSrc: "/payment-qr.jpg",
  qrRecipientName: "น.ส. ชลลานนา สายคำปา",
  qrAccountName: "xxx-x-x1188-x",
  qrReference: "004999123469479",
};

export const installmentPayments: InstallmentPayment[] = [
  {
    installmentNumber: 1,
    status: "paid",
    paidAmountSummary: "1,000 / 1,000",
    dueDateLabel: "19 ม.ค. 2570",
    outstandingAmount: "0",
    completedPaymentLabel: "ชำระเสร็จสิ้นเมื่อ",
    completedPaymentDateLabel: "7 ม.ค. 2570",
    completedPaymentTimeLabel: "17:00 น.",
  },
  {
    installmentNumber: 2,
    status: "current",
    paidAmountSummary: "300 / 1,000",
    dueDateLabel: "18 ก.พ. 2570",
    outstandingAmount: "700",
    paymentNote: "อีก 15 วันครบกำหนด",
    actionLabel: "ชำระงวดนี้ · คงเหลือ 700",
  },
  {
    installmentNumber: 3,
    status: "upcoming",
    paidAmountSummary: "500 / 1,000",
    dueDateLabel: "20 มี.ค. 2570",
    outstandingAmount: "500",
    paymentNote: "อีก 45 วันครบกำหนด",
    actionLabel: "กรุณาดำเนินการชำระงวดก่อนหน้าให้เสร็จสิ้น",
  },
];

export const loanRequestHistory: LoanRequestHistoryItem[] = [
  {
    requestNumber: "SL-2568-0001",
    statusLabel: activeLoan.statusLabel,
    statusType: "pending",
    submittedAt: "ยื่นเมื่อ 18 ธ.ค. 2569 10:00 น.",
    purpose: "ค่าเทอมภาคเรียนที่ 1/2569",
    amountLabel: "ชำระแล้ว",
    amount: `${activeLoan.paidAmount}/${activeLoan.totalAmount}`,
  },
  {
    requestNumber: "SL-2568-0002",
    statusLabel: "ปฏิเสธ · ผู้บริหาร",
    statusType: "rejectedExecutive",
    submittedAt: "ยื่นเมื่อ 10 พ.ย. 2569 09:30 น.",
    purpose: "ค่าเทอมภาคเรียนที่ 1/2569",
    amountLabel: "จำนวนที่ขอกู้",
    amount: "3,000",
  },
  {
    requestNumber: "SL-2568-0003",
    statusLabel: "รอยืนยันการรับเงิน",
    statusType: "waitingPaymentConfirmation",
    submittedAt: "ยื่นเมื่อ 4 พ.ย. 2569 13:15 น.",
    purpose: "ค่าใช้จ่ายเกี่ยวกับการศึกษา",
    amountLabel: "จำนวนที่ขอกู้",
    amount: "8,500",
  },
  {
    requestNumber: "SL-2568-0004",
    statusLabel: "รอแก้ไขเอกสาร",
    statusType: "revisionRequired",
    submittedAt: "ยื่นเมื่อ 28 ต.ค. 2569 11:00 น.",
    purpose: "ค่าเทอมภาคเรียนที่ 2/2568",
    amountLabel: "จำนวนที่ขอกู้",
    amount: "12,000",
  },
  {
    requestNumber: "SL-2568-0005",
    statusLabel: "รออาจารย์ที่ปรึกษา",
    statusType: "waitingAdvisorApproval",
    submittedAt: "ยื่นเมื่อ 22 ต.ค. 2569 14:20 น.",
    purpose: "ค่าเทอมภาคเรียนที่ 2/2568",
    amountLabel: "จำนวนที่ขอกู้",
    amount: "6,000",
  },
  {
    requestNumber: "SL-2568-0006",
    statusLabel: "รอผู้บริหาร",
    statusType: "waitingExecutiveApproval",
    submittedAt: "ยื่นเมื่อ 18 ต.ค. 2569 10:45 น.",
    purpose: "ค่าใช้จ่ายเกี่ยวกับการศึกษา",
    amountLabel: "จำนวนที่ขอกู้",
    amount: "9,000",
  },
  {
    requestNumber: "SL-2568-0007",
    statusLabel: "รอเจ้าหน้าที่",
    statusType: "waitingDocumentReview",
    submittedAt: "ยื่นเมื่อ 12 ต.ค. 2569 08:50 น.",
    purpose: "ค่าเทอมภาคเรียนที่ 2/2568",
    amountLabel: "จำนวนที่ขอกู้",
    amount: "10,500",
  },
  {
    requestNumber: "SL-2568-0008",
    statusLabel: "ชำระเสร็จสิ้น",
    statusType: "completed",
    submittedAt: "ยื่นเมื่อ 5 ก.ย. 2569 09:10 น.",
    purpose: "ค่าเทอมภาคเรียนที่ 1/2568",
    amountLabel: "ชำระแล้ว",
    amount: "7,500",
  },
];

export const loanDetailsByRequestNumber: Record<string, LoanDetails> = {
  "SL-2568-0001": {
    requestNumber: "SL-2568-0001",
    statusLabel: "อยู่ระหว่างชำระคืน",
    submittedAt: "ยื่นเมื่อ 18 ธ.ค. 2569 10:00 น.",
    purposeLabel: "วัตถุประสงค์การกู้ยืม",
    purpose: "ค่าเทอมภาคเรียนที่ 1/2569",
    amountLabel: "จำนวนที่ขอกู้",
    amount: "3,000",
    additionalReasonLabel: "หมายเหตุเพิ่มเติม",
    additionalReason: "สถานการณ์ทางการเงิน",
    downloadLabel: "ดาวน์โหลดสัญญาการกู้ยืม",
    transferSlipImage: "/mock-payment-receipt-2.jpg",
    timeline: [
      {
        title: "ส่งคำร้องกู้ยืม",
        dateTime: "18 ธ.ค. 2569 10:00 น.",
        actor: "กมลชนก มีโชค",
      },
      {
        title: "อาจารย์ที่ปรึกษาอนุมัติ",
        dateTime: "18 ธ.ค. 2569 10:00 น.",
        actor: "พิมพา มีโชค",
        commentTitle: "ความคิดเห็นของอาจารย์ที่ปรึกษา",
        comment: "ตรวจสอบข้อมูลแล้ว เห็นควรอนุมัติคำร้อง",
      },
      {
        title: "เจ้าหน้าที่ตรวจสอบเอกสาร",
        dateTime: "18 ธ.ค. 2569 10:00 น.",
        actor: "วรัญญู มีโชค",
      },
      {
        title: "ผู้บริหารพิจารณาอนุมัติ",
        dateTime: "18 ธ.ค. 2569 10:00 น.",
        actor: "เอกฤทธิ์ มีโชค",
        commentTitle: "ความคิดเห็นของผู้บริหาร",
        comment: "อนุมัติตามความจำเป็นและความเหมาะสมของคำร้อง",
      },
      {
        title: "เจ้าหน้าที่โอนเงิน จำนวน 3,000",
        dateTime: "18 ธ.ค. 2569 10:00 น.",
        actor: "วรัญญู มีโชค",
        isCompleted: true,
        transferDetails: [
          "ธนาคาร: ธนาคารกสิกรไทย",
          "เลขที่บัญชี: 1234567900",
          "ชื่อบัญชี: กมลชนก มีโชค",
        ],
      },
    ],
    schedule: [
      {
        installmentNumber: 1,
        dueDateLabel: "ครบกำหนด 7 ก.ค. 2569",
        amount: "1,000",
      },
      {
        installmentNumber: 2,
        dueDateLabel: "ครบกำหนด 9 ส.ค. 2569",
        amount: "1,000",
      },
      {
        installmentNumber: 3,
        dueDateLabel: "ครบกำหนด 8 ก.ย. 2569",
        amount: "1,000",
      },
    ],
    paymentHistory: [
      {
        installmentNumber: 1,
        amount: "1,000",
        receiptImage: "/mock-payment-receipt-1.jpg",
        paidAt: "ชำระเมื่อ 24 พ.ค. 2569 10:00 น.",
        checkedAt: "ตรวจสอบเมื่อ 25 พ.ค. 2569 10:00 น.",
        statusLabel: "ตรวจสอบสำเร็จ",
        status: "verified",
      },
      {
        installmentNumber: 2,
        amount: "500",
        receiptImage: "/mock-payment-receipt-1.jpg",
        paidAt: "ชำระเมื่อ 27 ก.ค. 2569 10:00 น.",
        checkedAt: "ตรวจสอบเมื่อ 28 ก.ค. 2569 10:00 น. · ไม่ผ่าน",
        statusLabel: "ไม่ผ่านการตรวจสอบ",
        status: "failed",
      },
      {
        installmentNumber: 2,
        amount: "500",
        receiptImage: "/mock-payment-receipt-1.jpg",
        paidAt: "ชำระเมื่อ 29 ก.ค. 2569 14:30 น.",
        checkedAt: "กำลังรอเจ้าหน้าที่ตรวจสอบ",
        statusLabel: "กำลังตรวจสอบ",
        status: "checking",
      },
      {
        installmentNumber: 3,
        amount: "500",
        receiptImage: "/mock-payment-receipt-1.jpg",
        paidAt: "ชำระเมื่อ 1 ส.ค. 2569 10:00 น.",
        checkedAt: "ตรวจสอบเมื่อ 2 ส.ค. 2569 10:00 น.",
        statusLabel: "ตรวจสอบสำเร็จ",
        status: "verified",
      },
    ],
    contact: loanContact,
  },
};

loanRequestHistory.forEach((request) => {
  if (loanDetailsByRequestNumber[request.requestNumber]) {
    return;
  }

  const templateDetails = loanDetailsByRequestNumber[activeLoan.requestNumber];
  loanDetailsByRequestNumber[request.requestNumber] = {
    ...templateDetails,
    requestNumber: request.requestNumber,
    statusLabel: request.statusLabel,
    submittedAt: request.submittedAt,
    purpose: request.purpose,
    amountLabel: request.amountLabel,
    amount: request.amount,
    additionalReason: "ข้อมูลประกอบคำร้องตามรายละเอียดที่นักศึกษายื่นไว้",
  };
});

export function getLoanDetails(requestNumber: string) {
  return loanDetailsByRequestNumber[requestNumber] ?? null;
}
