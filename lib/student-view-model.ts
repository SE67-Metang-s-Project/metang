import type { LoanStatus } from "@/lib/generated/prisma/client";
import type {
  InstallmentPayment,
  InstallmentStatus,
  LoanDetails,
  LoanPaymentHistoryItem,
  LoanRequestHistoryItem,
  LoanRequestStatus,
  LoanScheduleItem,
  LoanTimelineItem,
} from "@/app/student/studentMockData";

export type StatusDisplay = {
  label: string;
  statusType: LoanRequestStatus;
};

const statusDisplayMap: Record<LoanStatus, StatusDisplay> = {
  draft: {
    label: "แบบร่าง",
    statusType: "pending",
  },
  returned: {
    label: "ส่งกลับแก้ไข",
    statusType: "revisionRequired",
  },
  pending_advisor: {
    label: "รออาจารย์ที่ปรึกษาพิจารณา",
    statusType: "waitingAdvisorApproval",
  },
  pending_admin: {
    label: "รอเจ้าหน้าที่ตรวจสอบเอกสาร",
    statusType: "waitingDocumentReview",
  },
  pending_executive: {
    label: "รอผู้บริหารอนุมัติ",
    statusType: "waitingExecutiveApproval",
  },
  pending_disbursement: {
    label: "รอยืนยันการโอนเงิน",
    statusType: "waitingPaymentConfirmation",
  },
  disbursed: {
    label: "อยู่ระหว่างการชำระเงิน",
    statusType: "pending",
  },
  closed: {
    label: "เสร็จสิ้น (ชำระครบแล้ว)",
    statusType: "completed",
  },
  rejected: {
    label: "ไม่อนุมัติ",
    statusType: "rejectedExecutive",
  },
  cancelled: {
    label: "ยกเลิกคำร้อง",
    statusType: "rejectedExecutive",
  },
};

export function mapLoanStatus(status: LoanStatus): StatusDisplay {
  return statusDisplayMap[status] ?? { label: status, statusType: "pending" };
}

const thaiMonthShort = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

export function formatThaiDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "-";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return String(dateInput);

  const day = date.getDate();
  const month = thaiMonthShort[date.getMonth()];
  const year = date.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

export function formatThaiDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "-";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return String(dateInput);

  const datePart = formatThaiDate(date);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${datePart} ${hours}:${minutes} น.`;
}

export type RawLoanApproval = {
  id?: string | number | bigint;
  step: "advisor" | "admin" | "executive";
  attempt: number;
  decision: "pending" | "approved" | "returned" | "rejected";
  decidedBy?: string | null;
  decidedAt?: string | Date | null;
  comment?: string | null;
  decider?: { fullNameTh?: string | null } | null;
};

export type RawInstallment = {
  id?: string | number | bigint;
  seq: number;
  dueDate: string | Date;
  amountDue: number;
  amountPaid: number;
  settledAt?: string | Date | null;
};

export type RawPayment = {
  id?: string;
  installmentId?: string | number | bigint | null;
  amount: number;
  slipUrl?: string | null;
  status: string;
  paidAt?: string | Date | null;
  confirmedAt?: string | Date | null;
  createdAt?: string | Date;
};

export type RawStudentLoan = {
  id: string;
  studentId?: string;
  amount: number;
  approvedAmount?: number | null;
  purpose: string;
  additionalNote?: string | null;
  installmentCount: number;
  firstDueDate: string | Date;
  status: LoanStatus;
  submittedAt?: string | Date | null;
  disbursedAt?: string | Date | null;
  closedAt?: string | Date | null;
  createdAt?: string | Date;
  advisor?: {
    id?: string;
    fullNameTh?: string | null;
    fullNameEn?: string | null;
  } | null;
  approvals?: RawLoanApproval[];
  installments?: RawInstallment[];
  payments?: RawPayment[];
};

export function formatRequestNumber(id: string): string {
  return id;
}

export function mapToLoanRequestHistoryItem(loan: RawStudentLoan): LoanRequestHistoryItem {
  const display = mapLoanStatus(loan.status);
  const effectiveAmount = loan.approvedAmount ?? loan.amount;
  const isDisbursed = loan.status === "disbursed" || loan.status === "closed";

  let amountString = `${effectiveAmount.toLocaleString("th-TH")} บาท`;
  if (isDisbursed && loan.installments && loan.installments.length > 0) {
    const paid = loan.installments.reduce((sum, item) => sum + item.amountPaid, 0);
    amountString = `${paid.toLocaleString("th-TH")}/${effectiveAmount.toLocaleString("th-TH")}`;
  }

  return {
    requestNumber: formatRequestNumber(loan.id),
    statusLabel: display.label,
    statusType: display.statusType,
    submittedAt: formatThaiDateTime(loan.submittedAt ?? loan.createdAt),
    purpose: loan.purpose,
    amountLabel: isDisbursed ? "ยอดเงินที่ชำระแล้ว/ยอดกู้" : "จำนวนเงินที่ขอกู้",
    amount: amountString,
  };
}

export type ActiveLoanSummary = {
  id: string;
  requestNumber: string;
  status: LoanStatus;
  statusLabel: string;
  statusType: LoanRequestStatus;
  paidAmount: string;
  totalAmount: string;
  nextInstallmentNumber: number;
  nextDueDate: string;
  isDisbursed: boolean;
};

export function mapToActiveLoanSummary(loan: RawStudentLoan | null): ActiveLoanSummary | null {
  if (!loan) return null;
  const display = mapLoanStatus(loan.status);
  const total = loan.approvedAmount ?? loan.amount;
  const installments = loan.installments ?? [];
  const paid = installments.reduce((sum, item) => sum + item.amountPaid, 0);

  const nextInstallment = installments.find((item) => !item.settledAt) ?? installments[0];
  const nextNumber = nextInstallment?.seq ?? 1;
  const nextDue = nextInstallment ? formatThaiDate(nextInstallment.dueDate) : formatThaiDate(loan.firstDueDate);

  return {
    id: loan.id,
    requestNumber: formatRequestNumber(loan.id),
    status: loan.status,
    statusLabel: display.label,
    statusType: display.statusType,
    paidAmount: paid.toLocaleString("th-TH"),
    totalAmount: total.toLocaleString("th-TH"),
    nextInstallmentNumber: nextNumber,
    nextDueDate: nextDue,
    isDisbursed: loan.status === "disbursed",
  };
}

export function mapToInstallmentPayments(installments: RawInstallment[] = []): InstallmentPayment[] {
  return installments.map((inst) => {
    let status: InstallmentStatus = "upcoming";
    if (inst.settledAt || inst.amountPaid >= inst.amountDue) {
      status = "paid";
    } else if (inst.amountPaid > 0) {
      status = "current";
    }

    const remaining = Math.max(0, inst.amountDue - inst.amountPaid);
    const dateLabel = formatThaiDate(inst.dueDate);

    return {
      installmentNumber: inst.seq,
      status,
      paidAmountSummary: `${inst.amountPaid.toLocaleString("th-TH")}/${inst.amountDue.toLocaleString("th-TH")} บาท`,
      dueDateLabel: `ครบกำหนด ${dateLabel}`,
      outstandingAmount: `${remaining.toLocaleString("th-TH")} บาท`,
      actionLabel: status !== "paid" ? "ชำระเงิน" : undefined,
      completedPaymentLabel: status === "paid" ? "ชำระเรียบร้อยแล้ว" : undefined,
      completedPaymentDateLabel: inst.settledAt ? formatThaiDate(inst.settledAt) : undefined,
    };
  });
}

export function mapToLoanDetails(loan: RawStudentLoan): LoanDetails {
  const display = mapLoanStatus(loan.status);
  const effectiveAmount = loan.approvedAmount ?? loan.amount;

  const timeline: LoanTimelineItem[] = [];

  // Initial submission
  if (loan.submittedAt || loan.createdAt) {
    timeline.push({
      title: "ยื่นคำร้องกู้ยืมเงิน",
      dateTime: formatThaiDateTime(loan.submittedAt ?? loan.createdAt),
      actor: "นักศึกษา",
      isCompleted: true,
    });
  }

  // Approvals timeline
  const approvals = [...(loan.approvals ?? [])].sort((a, b) => {
    const timeA = a.decidedAt ? new Date(a.decidedAt).getTime() : 0;
    const timeB = b.decidedAt ? new Date(b.decidedAt).getTime() : 0;
    return timeA - timeB;
  });

  for (const app of approvals) {
    if (app.decision === "pending") continue;

    let stepTitle = "";
    let actorName = "";
    let commentTitle = "";

    if (app.step === "advisor") {
      actorName = app.decider?.fullNameTh ?? loan.advisor?.fullNameTh ?? "อาจารย์ที่ปรึกษา";
      if (app.decision === "approved") {
        stepTitle = "อาจารย์ที่ปรึกษาพิจารณาเห็นชอบ";
      } else if (app.decision === "returned") {
        stepTitle = "อาจารย์ที่ปรึกษาส่งกลับแก้ไข";
        commentTitle = "ข้อความจากอาจารย์ที่ปรึกษา";
      } else if (app.decision === "rejected") {
        stepTitle = "อาจารย์ที่ปรึกษาไม่อนุมัติคำร้อง";
        commentTitle = "เหตุผลที่ไม่อนุมัติ";
      }
    } else if (app.step === "admin") {
      actorName = app.decider?.fullNameTh ?? "เจ้าหน้าที่";
      if (app.decision === "approved") {
        stepTitle = "เจ้าหน้าที่ตรวจสอบเอกสารผ่านการอนุมัติ";
      } else if (app.decision === "returned") {
        stepTitle = "เจ้าหน้าที่ส่งกลับแก้ไข";
        commentTitle = "ข้อความจากเจ้าหน้าที่";
      } else if (app.decision === "rejected") {
        stepTitle = "เจ้าหน้าที่ไม่อนุมัติคำร้อง";
        commentTitle = "เหตุผลที่ไม่อนุมัติ";
      }
    } else if (app.step === "executive") {
      actorName = app.decider?.fullNameTh ?? "ผู้บริหาร";
      if (app.decision === "approved") {
        stepTitle = "ผู้บริหารอนุมัติคำร้องกู้ยืม";
      } else if (app.decision === "returned") {
        stepTitle = "ผู้บริหารส่งกลับแก้ไขให้เจ้าหน้าที่ตรวจสอบใหม่";
        commentTitle = "ข้อความจากผู้บริหาร";
      } else if (app.decision === "rejected") {
        stepTitle = "ผู้บริหารไม่อนุมัติคำร้อง";
        commentTitle = "เหตุผลที่ไม่อนุมัติ";
      }
    }

    if (stepTitle) {
      timeline.push({
        title: stepTitle,
        dateTime: formatThaiDateTime(app.decidedAt),
        actor: actorName,
        commentTitle: commentTitle || undefined,
        comment: app.comment || undefined,
        isCompleted: app.decision === "approved",
      });
    }
  }

  // Disbursed
  if (loan.disbursedAt) {
    timeline.push({
      title: "โอนเงินเรียบร้อยแล้ว",
      dateTime: formatThaiDateTime(loan.disbursedAt),
      actor: "เจ้าหน้าที่การเงิน",
      isCompleted: true,
    });
  }

  // Repayment schedule
  let schedule: LoanScheduleItem[] = [];
  if (loan.installments && loan.installments.length > 0) {
    schedule = loan.installments.map((inst) => ({
      installmentNumber: inst.seq,
      dueDateLabel: `ครบกำหนด ${formatThaiDate(inst.dueDate)}`,
      amount: `${inst.amountDue.toLocaleString("th-TH")} บาท`,
    }));
  } else {
    // Estimated schedule
    const count = loan.installmentCount || 1;
    const perMonth = Math.floor(effectiveAmount / count);
    const remainder = effectiveAmount % count;
    const firstDue = loan.firstDueDate ? new Date(loan.firstDueDate) : new Date();

    schedule = Array.from({ length: count }, (_, idx) => {
      const d = new Date(firstDue);
      d.setMonth(d.getMonth() + idx);
      const amount = idx === count - 1 ? perMonth + remainder : perMonth;
      return {
        installmentNumber: idx + 1,
        dueDateLabel: `ครบกำหนด ${formatThaiDate(d)}`,
        amount: `${amount.toLocaleString("th-TH")} บาท`,
      };
    });
  }

  // Payment history
  const paymentHistory: LoanPaymentHistoryItem[] = (loan.payments ?? []).map((pay, idx) => ({
    installmentNumber: idx + 1,
    amount: `${pay.amount.toLocaleString("th-TH")} บาท`,
    receiptImage: pay.slipUrl ?? "",
    paidAt: formatThaiDateTime(pay.paidAt ?? pay.createdAt),
    checkedAt: formatThaiDateTime(pay.confirmedAt),
    statusLabel: pay.status === "confirmed" ? "ตรวจสอบแล้ว" : "รอตรวจสอบ",
    status: pay.status === "confirmed" ? "verified" : "checking",
  }));

  return {
    requestNumber: formatRequestNumber(loan.id),
    statusLabel: display.label,
    submittedAt: formatThaiDateTime(loan.submittedAt ?? loan.createdAt),
    purposeLabel: "วัตถุประสงค์การกู้ยืม",
    purpose: loan.purpose,
    amountLabel: "จำนวนเงินที่ขอกู้",
    amount: `${effectiveAmount.toLocaleString("th-TH")} บาท`,
    additionalReasonLabel: "เหตุผลความจำเป็นเพิ่มเติม",
    additionalReason: loan.additionalNote ?? "-",
    downloadLabel: "ดาวน์โหลดแบบคำร้อง (PDF)",
    transferSlipImage: "",
    timeline,
    schedule,
    paymentHistory,
    contact: {
      phone: "053-949-012",
      email: "nurse@cmu.ac.th",
      location: "คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่",
      openingHours: "จันทร์ - ศุกร์ 08:30 - 16:30 น.",
    },
  };
}

export type PaymentBehaviorDisplay = {
  totalLoanRequests: number;
  totalInstallments: number;
  onTimeInstallments: number;
  lateInstallments: number;
  onTimeStatusLabel: string;
  hasHistory: boolean;
};

export function computePaymentBehavior(loans?: RawStudentLoan[] | null): PaymentBehaviorDisplay {
  if (!loans || loans.length === 0) {
    return {
      totalLoanRequests: 0,
      totalInstallments: 0,
      onTimeInstallments: 0,
      lateInstallments: 0,
      onTimeStatusLabel: "ไม่เคยมีประวัติการกู้ยืม",
      hasHistory: false,
    };
  }

  let onTime = 0;
  let late = 0;
  let totalInstallments = 0;
  const now = new Date();

  for (const loan of loans) {
    if (!loan.installments || !Array.isArray(loan.installments)) continue;
    for (const inst of loan.installments) {
      totalInstallments++;
      const dueDate = new Date(inst.dueDate);
      const paidDate = inst.settledAt ? new Date(inst.settledAt) : null;

      if (paidDate) {
        if (paidDate <= dueDate) {
          onTime++;
        } else {
          late++;
        }
      } else if (inst.amountPaid < inst.amountDue && now > dueDate) {
        late++;
      }
    }
  }

  if (totalInstallments === 0) {
    return {
      totalLoanRequests: loans.length,
      totalInstallments: 0,
      onTimeInstallments: 0,
      lateInstallments: 0,
      onTimeStatusLabel: "ยังไม่มีประวัติการชำระเงิน",
      hasHistory: false,
    };
  }

  return {
    totalLoanRequests: loans.length,
    totalInstallments,
    onTimeInstallments: onTime,
    lateInstallments: late,
    onTimeStatusLabel: late > 0 ? "ชำระล่าช้า" : "ชำระตรงเวลา",
    hasHistory: true,
  };
}

