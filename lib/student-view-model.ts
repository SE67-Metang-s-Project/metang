import type { LoanStatus } from "@/lib/generated/prisma/client";
import { bangkokDateKey, bangkokParts } from "@/lib/date";
import { deriveInstallmentConduct } from "@/lib/repayment-conduct";
import type { ApprovalStep } from "@/components/shared/disburse-debt/DisburseDebtCard";
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
import { normalizeBankName } from "@/lib/bank-name";

export type StatusDisplay = {
  label: string;
  statusType: LoanRequestStatus;
};

const statusDisplayMap: Record<LoanStatus, StatusDisplay> = {
  draft: {
    label: "แบบร่าง",
    statusType: "draft",
  },
  returned: {
    label: "แก้ไขเอกสาร",
    statusType: "revisionRequired",
  },
  pending_advisor: {
    label: "รออาจารย์",
    statusType: "waitingAdvisorApproval",
  },
  pending_admin: {
    label: "รอเจ้าหน้าที่",
    statusType: "waitingDocumentReview",
  },
  pending_executive: {
    label: "รอผู้บริหาร",
    statusType: "waitingExecutiveApproval",
  },
  pending_disbursement: {
    label: "รอยืนยันการโอนเงิน",
    statusType: "waitingPaymentConfirmation",
  },
  disbursed: {
    label: "รอยืนยันการโอนเงิน",
    statusType: "waitingPaymentConfirmation",
  },
  closed: {
    label: "ชำระแล้ว",
    statusType: "completed",
  },
  rejected: {
    label: "ไม่อนุมัติโดยผู้บริหาร",
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

  // Bangkok parts, not getDate(): the server renders in UTC and the browser in its own zone.
  const { day, month, year } = bangkokParts(date);
  return `${day} ${thaiMonthShort[month - 1]} ${year + 543}`;
}

export function formatThaiTime(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const { hour, minute } = bangkokParts(date);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} น.`;
}

export function formatThaiDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "-";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return String(dateInput);

  return `${formatThaiDate(date)} ${formatThaiTime(date)}`;
}

export type RawLoanApproval = {
  id?: string | number | bigint;
  step: "advisor" | "admin" | "executive";
  attempt: number;
  decision: "pending" | "approved" | "returned" | "rejected";
  decidedBy?: string | null;
  decidedAt?: string | Date | null;
  comment?: string | null;
  decider?: { fullNameTh?: string | null; fullNameEn?: string | null } | null;
};

export type RawInstallment = {
  id?: string | number | bigint;
  seq: number;
  dueDate: string | Date;
  amountDue: number;
  amountPaid: number;
  settledAt?: string | Date | null;
};

export type RawPaymentStatus = "pending_review" | "confirmed" | "rejected";

export type RawPayment = {
  id?: string;
  installmentId?: string | number | bigint | null;
  amount: number;
  // The student read replaces slipPath with this flag; the slip itself is served by
  // GET /api/payments/{id}/slip.
  hasSlip?: boolean;
  status: RawPaymentStatus;
  paidAt?: string | Date | null;
  confirmedAt?: string | Date | null;
  reviewNote?: string | null;
  createdAt?: string | Date;
};

function paymentTime(payment: RawPayment) {
  return payment.createdAt ? new Date(payment.createdAt).getTime() : 0;
}

/** Oldest first; the student loan read returns payments newest first. */
function sortPaymentsOldestFirst(payments: RawPayment[] = []) {
  return [...payments].sort((a, b) => paymentTime(a) - paymentTime(b));
}

export function paymentSlipUrl(payment: RawPayment): string {
  return payment.hasSlip && payment.id ? `/api/payments/${payment.id}/slip` : "";
}

export type RawStudentLoan = {
  id: string;
  studentId?: string;
  amount: number;
  approvedAmount?: number | null;
  studentYear?: number;
  purpose: string;
  additionalNote?: string | null;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  installmentCount: number;
  firstDueDate: string | Date;
  status: LoanStatus;
  submittedAt?: string | Date | null;
  cancelledAt?: string | Date | null;
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
  fundTransactions?: { id: string }[];
};

const rejectionRoleByStep: Record<RawLoanApproval["step"], string> = {
  advisor: "อาจารย์",
  admin: "เจ้าหน้าที่",
  executive: "ผู้บริหาร",
};

function getRejectedStatusLabel(loan: RawStudentLoan, fallbackLabel: string) {
  if (loan.status !== "rejected") return fallbackLabel;

  const rejectedApproval = [...(loan.approvals ?? [])]
    .sort((a, b) => {
      const timeA = a.decidedAt ? new Date(a.decidedAt).getTime() : 0;
      const timeB = b.decidedAt ? new Date(b.decidedAt).getTime() : 0;
      return timeB - timeA;
    })
    .find((approval) => approval.decision === "rejected");

  return rejectedApproval
    ? `ไม่อนุมัติโดย${rejectionRoleByStep[rejectedApproval.step]}`
    : fallbackLabel;
}

const paymentHistoryStatus: Record<
  RawPaymentStatus,
  Pick<LoanPaymentHistoryItem, "status" | "statusLabel">
> = {
  pending_review: { status: "checking", statusLabel: "รอตรวจสอบ" },
  confirmed: { status: "verified", statusLabel: "ตรวจสอบแล้ว" },
  rejected: { status: "failed", statusLabel: "ไม่ผ่าน" },
};

export function formatRequestNumber(id: string): string {
  return id;
}

export function mapToLoanRequestHistoryItem(loan: RawStudentLoan): LoanRequestHistoryItem {
  const display = mapLoanStatus(loan.status);
  const effectiveAmount = loan.approvedAmount ?? loan.amount;
  const isDisbursed = loan.status === "disbursed" || loan.status === "closed";
  const statusLabel = getRejectedStatusLabel(loan, display.label);

  let amountString = effectiveAmount.toLocaleString("th-TH");
  if (isDisbursed && loan.installments && loan.installments.length > 0) {
    const paid = loan.installments.reduce((sum, item) => sum + item.amountPaid, 0);
    amountString = `${paid.toLocaleString("th-TH")}/${effectiveAmount.toLocaleString("th-TH")}`;
  }

  return {
    requestNumber: formatRequestNumber(loan.id),
    statusLabel,
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
  transferSlipImage?: string;
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
    statusLabel: getRejectedStatusLabel(loan, display.label),
    statusType: display.statusType,
    paidAmount: paid.toLocaleString("th-TH"),
    totalAmount: total.toLocaleString("th-TH"),
    nextInstallmentNumber: nextNumber,
    nextDueDate: nextDue,
    isDisbursed: loan.status === "disbursed",
    transferSlipImage: loan.fundTransactions?.[0]?.id
      ? `/api/fund-transactions/${loan.fundTransactions[0].id}/slip`
      : undefined,
  };
}

export function mapToInstallmentPayments(
  installments: RawInstallment[] = [],
  payments: RawPayment[] = [],
  now: Date = new Date(),
): InstallmentPayment[] {
  let nextPayableFound = false;
  const orderedPayments = sortPaymentsOldestFirst(payments);
  // The server accepts one submission awaiting review per loan, not per installment.
  const isAwaitingReview = orderedPayments.some((pay) => pay.status === "pending_review");
  const latestPayment = orderedPayments.at(-1);
  const hasRejectedPayment = latestPayment?.status === "rejected";
  // Same conduct rule as computePaymentBehavior, so the cards and the conduct summary agree.
  const conduct = deriveInstallmentConduct(installments, payments, now);
  const today = bangkokDateKey(now);

  return installments.map((inst, index) => {
    const isSettled = Boolean(inst.settledAt) || inst.amountPaid >= inst.amountDue;

    let status: InstallmentStatus = "upcoming";
    if (isSettled) {
      status = "paid";
    } else if (!nextPayableFound) {
      status = "current";
      nextPayableFound = true;
    }

    const remaining = Math.max(0, inst.amountDue - inst.amountPaid);
    const dateLabel = formatThaiDate(inst.dueDate);
    const dueKey = bangkokDateKey(inst.dueDate);
    const isOverdue = status === "current" && today > dueKey;
    const dueInDays = Math.round(
      (Date.parse(`${dueKey}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000,
    );

    return {
      installmentNumber: inst.seq,
      status,
      paidAmountSummary: `${inst.amountPaid.toLocaleString("th-TH")}/${inst.amountDue.toLocaleString("th-TH")}`,
      dueDateLabel: `ครบกำหนด ${dateLabel}`,
      outstandingAmount: remaining.toLocaleString("th-TH"),
      actionLabel: status !== "paid" ? "ชำระเงิน" : undefined,
      completedPaymentLabel: status === "paid" ? "ชำระเรียบร้อยแล้ว" : undefined,
      completedPaymentDateLabel: inst.settledAt ? formatThaiDate(inst.settledAt) : undefined,
      completedPaymentTimeLabel: inst.settledAt ? formatThaiTime(inst.settledAt) : undefined,
      dueInDays: status === "current" && hasRejectedPayment && !isOverdue ? dueInDays : undefined,
      // Overdue from the day after the due date, on Bangkok calendar days.
      isOverdue,
      isPaidLate: status === "paid" && conduct[index] === "late",
      // Upcoming installments keep "pay the previous installment first".
      isAwaitingReview: status === "current" && isAwaitingReview,
    };
  });
}

export function mapToLoanDetails(loan: RawStudentLoan): LoanDetails {
  const requestedAmount = loan.approvedAmount ?? loan.amount;

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
  const latestExecutiveReturn = approvals
    .filter((approval) => approval.step === "executive" && approval.decision === "returned")
    .at(-1);
  const executiveReturnAttempt = latestExecutiveReturn?.attempt ?? -1;
  const latestAdminDecision = approvals
    .filter((approval) => approval.step === "admin" && approval.decision !== "pending")
    .at(-1);
  const isExecutiveAdminRecheck =
    loan.status === "pending_admin" &&
    latestExecutiveReturn &&
    approvals.some(
      (approval) =>
        approval.step === "admin" &&
        approval.decision === "pending" &&
        approval.attempt > executiveReturnAttempt,
    ) &&
    (!latestAdminDecision ||
      new Date(latestAdminDecision.decidedAt ?? 0).getTime() <
        new Date(latestExecutiveReturn.decidedAt ?? 0).getTime());
  const studentVisibleStatus: LoanStatus = isExecutiveAdminRecheck
    ? "pending_executive"
    : loan.status;
  const display = mapLoanStatus(studentVisibleStatus);
  const statusLabel = getRejectedStatusLabel({ ...loan, status: studentVisibleStatus }, display.label);
  const studentTimelineApprovals = isExecutiveAdminRecheck
    ? approvals.filter(
        (approval) =>
          !(
            (approval.step === "executive" &&
              approval.decision === "returned" &&
              approval.attempt === executiveReturnAttempt) ||
            (approval.step === "admin" &&
              approval.decision === "pending" &&
              approval.attempt > executiveReturnAttempt)
          ),
      )
    : approvals;
  const activePendingStep =
    studentVisibleStatus === "pending_advisor"
      ? "advisor"
      : studentVisibleStatus === "pending_admin"
        ? "admin"
        : studentVisibleStatus === "pending_executive"
          ? "executive"
          : null;

  const getRevisionCommentTitle = (
    step: RawLoanApproval["step"],
    revisionCount: number,
  ) => {
    const roleLabel =
      step === "advisor" ? "อาจารย์ที่ปรึกษา" : step === "admin" ? "เจ้าหน้าที่" : "ผู้บริหาร";
    const revisionSuffix = revisionCount > 1 ? ` (ครั้งที่ ${revisionCount})` : "";

    return `${roleLabel}แจ้งแก้ไข${revisionSuffix}`;
  };

  for (const [approvalIndex, app] of studentTimelineApprovals.entries()) {
    if (app.decision === "pending") {
      if (app.step !== activePendingStep || !app.comment?.trim()) continue;

      const pendingDetails =
        app.step === "advisor"
          ? {
              title: "อาจารย์ที่ปรึกษาพิจารณาคำร้อง",
              actor: app.decider?.fullNameTh ?? loan.advisor?.fullNameTh ?? "อาจารย์ที่ปรึกษา",
              actorEn: app.decider?.fullNameEn ?? loan.advisor?.fullNameEn ?? undefined,
              commentTitle: "อาจารย์ที่ปรึกษาแจ้งแก้ไข",
            }
          : app.step === "admin"
            ? {
                title: "เจ้าหน้าที่ตรวจสอบเอกสารครบถ้วน",
                actor: app.decider?.fullNameTh ?? "เจ้าหน้าที่",
                commentTitle: "ข้อความจากเจ้าหน้าที่",
              }
            : {
                title: "ผู้บริหารอนุมัติคำร้องกู้ยืม",
                actor: app.decider?.fullNameTh ?? "ผู้บริหาร",
                commentTitle: "ข้อความจากผู้บริหาร",
              };

      timeline.push({
        title: pendingDetails.title,
        dateTime: "กำลังดำเนินการ",
        actor: pendingDetails.actor,
        actorEn: pendingDetails.actorEn,
        commentTitle: pendingDetails.commentTitle,
        comment: app.comment,
        isPending: true,
      });
      continue;
    }

    let stepTitle = "";
    let actorName = "";
    let actorNameEn: string | undefined;
    let commentTitle = "";

    if (app.step === "advisor") {
      actorName = app.decider?.fullNameTh ?? loan.advisor?.fullNameTh ?? "อาจารย์ที่ปรึกษา";
      actorNameEn = app.decider?.fullNameEn ?? loan.advisor?.fullNameEn ?? undefined;
      if (app.decision === "approved") {
        stepTitle = "อาจารย์ที่ปรึกษาพิจารณาเห็นชอบ";
        commentTitle = "ความคิดเห็นของอาจารย์ที่ปรึกษา";
      } else if (app.decision === "returned") {
        stepTitle = "อาจารย์ที่ปรึกษาส่งกลับแก้ไข";
        commentTitle = getRevisionCommentTitle(
          app.step,
          studentTimelineApprovals.slice(0, approvalIndex + 1).filter(
            (approval) => approval.step === app.step && approval.decision === "returned",
          ).length,
        );
      } else if (app.decision === "rejected") {
        stepTitle = "อาจารย์ที่ปรึกษาไม่อนุมัติคำร้อง";
        commentTitle = "เหตุผลที่ไม่อนุมัติ";
      }
    } else if (app.step === "admin") {
      actorName = app.decider?.fullNameTh ?? "เจ้าหน้าที่";
      if (app.decision === "approved") {
        stepTitle = "เจ้าหน้าที่ตรวจสอบเอกสารผ่านการอนุมัติ";
        commentTitle = "ความคิดเห็นของเจ้าหน้าที่";
      } else if (app.decision === "returned") {
        stepTitle = "เจ้าหน้าที่ส่งกลับแก้ไข";
        commentTitle = getRevisionCommentTitle(
          app.step,
          studentTimelineApprovals.slice(0, approvalIndex + 1).filter(
            (approval) => approval.step === app.step && approval.decision === "returned",
          ).length,
        );
      } else if (app.decision === "rejected") {
        stepTitle = "เจ้าหน้าที่ไม่อนุมัติคำร้อง";
        commentTitle = "เหตุผลที่ไม่อนุมัติ";
      }
    } else if (app.step === "executive") {
      actorName = app.decider?.fullNameTh ?? "ผู้บริหาร";
      if (app.decision === "approved") {
        stepTitle = "ผู้บริหารอนุมัติคำร้องกู้ยืม";
        commentTitle = "ความคิดเห็นของผู้บริหาร";
      } else if (app.decision === "returned") {
        stepTitle = "ผู้บริหารส่งกลับแก้ไขให้เจ้าหน้าที่ตรวจสอบใหม่";
        commentTitle = getRevisionCommentTitle(
          app.step,
          studentTimelineApprovals.slice(0, approvalIndex + 1).filter(
            (approval) => approval.step === app.step && approval.decision === "returned",
          ).length,
        );
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
        actorEn: actorNameEn,
        commentTitle: commentTitle || undefined,
        comment: app.comment || undefined,
        isCompleted: app.decision === "approved",
        isFailed: app.decision === "rejected",
      });
    }
  }

  if (loan.cancelledAt) {
    timeline.push({
      title: "ยกเลิกคำร้อง",
      dateTime: formatThaiDateTime(loan.cancelledAt),
      actor: "นักศึกษา",
      isFailed: true,
    });
  }

  const pendingSteps: Partial<
    Record<
      LoanStatus,
      { title: string; actor: string; actorEn?: string; next?: { title: string; actor: string } }
    >
  > = {
    pending_advisor: {
      title: "อาจารย์ที่ปรึกษาพิจารณาคำร้อง",
      actor: loan.advisor?.fullNameTh ?? "อาจารย์ที่ปรึกษา",
      actorEn: loan.advisor?.fullNameEn ?? undefined,
      next: { title: "เจ้าหน้าที่ตรวจสอบเอกสาร", actor: "เจ้าหน้าที่" },
    },
    pending_admin: {
      title: "เจ้าหน้าที่ตรวจสอบเอกสาร",
      actor: "เจ้าหน้าที่",
      next: { title: "ผู้บริหารพิจารณาอนุมัติคำร้อง", actor: "ผู้บริหาร" },
    },
    pending_executive: {
      title: "ผู้บริหารพิจารณาอนุมัติคำร้อง",
      actor: "ผู้บริหาร",
      next: { title: "เจ้าหน้าที่การเงินดำเนินการโอนเงิน", actor: "เจ้าหน้าที่การเงิน" },
    },
    pending_disbursement: {
      title: "เจ้าหน้าที่การเงินยืนยันการโอนเงิน",
      actor: "เจ้าหน้าที่การเงิน",
      next: { title: "ได้รับเงินกู้และเริ่มชำระคืน", actor: "นักศึกษา" },
    },
  };
  const pendingStep = pendingSteps[studentVisibleStatus];

  if (pendingStep) {
    const { next, ...currentStep } = pendingStep;
    timeline.push({
      ...currentStep,
      dateTime: "กำลังดำเนินการ",
      isPending: true,
    });
    if (next) {
      timeline.push({
        ...next,
        dateTime: "ขั้นตอนถัดไป",
        isUpcoming: true,
      });
    }
  }

  // Disbursed
  if (loan.disbursedAt) {
    timeline.push({
      title: `เจ้าหน้าที่โอนเงิน จำนวน ${requestedAmount.toLocaleString("th-TH")}`,
      dateTime: formatThaiDateTime(loan.disbursedAt),
      actor: "เจ้าหน้าที่",
      isCompleted: true,
      transferDetails: [
        `ธนาคาร: ${loan.bankName ? normalizeBankName(loan.bankName) : "-"}`,
        `เลขที่บัญชี: ${loan.bankAccountNo ?? "-"}`,
        `ชื่อบัญชี: ${loan.bankAccountName ?? "-"}`,
      ],
    });
  }

  // Repayment schedule
  let schedule: LoanScheduleItem[] = [];
  if (loan.installments && loan.installments.length > 0) {
    schedule = loan.installments.map((inst) => ({
      installmentNumber: inst.seq,
      dueDateLabel: `ครบกำหนด ${formatThaiDate(inst.dueDate)}`,
      amount: inst.amountDue.toLocaleString("th-TH"),
    }));
  } else {
    // Estimated schedule
    const count = loan.installmentCount || 1;
    const perMonth = Math.floor(requestedAmount / count);
    const remainder = requestedAmount % count;
    const firstDue = loan.firstDueDate ? new Date(loan.firstDueDate) : new Date();

    schedule = Array.from({ length: count }, (_, idx) => {
      const d = new Date(firstDue);
      d.setUTCDate(d.getUTCDate() + 30 * idx);
      const amount = idx === count - 1 ? perMonth + remainder : perMonth;
      return {
        installmentNumber: idx + 1,
        dueDateLabel: `ครบกำหนด ${formatThaiDate(d)}`,
        amount: amount.toLocaleString("th-TH"),
      };
    });
  }

  const disbursementTransactionId = loan.fundTransactions?.[0]?.id;

  // Payment history, oldest first: LoanPaymentHistory numbers repeat attempts in that order.
  const installmentSeqById = new Map(
    (loan.installments ?? []).map((inst) => [String(inst.id), inst.seq]),
  );
  const paymentHistory: LoanPaymentHistoryItem[] = sortPaymentsOldestFirst(loan.payments).map(
    (pay, idx) => ({
      id: pay.id,
      installmentNumber:
        (pay.installmentId != null ? installmentSeqById.get(String(pay.installmentId)) : undefined) ??
        idx + 1,
      amount: pay.amount.toLocaleString("th-TH"),
      receiptImage: paymentSlipUrl(pay),
      paidAt: formatThaiDateTime(pay.paidAt ?? pay.createdAt),
      checkedAt: formatThaiDateTime(pay.confirmedAt),
      ...paymentHistoryStatus[pay.status],
      reviewNote: pay.status === "rejected" ? (pay.reviewNote ?? undefined) : undefined,
    }),
  );

  const mappedApprovals: ApprovalStep[] = studentTimelineApprovals
    .filter((a) => a.decision !== "pending")
    .map((a) => ({
      step: a.step,
      actorName:
        a.decider?.fullNameTh ??
        (a.step === "advisor"
          ? (loan.advisor?.fullNameTh ?? "อาจารย์ที่ปรึกษา")
          : a.step === "admin"
            ? "เจ้าหน้าที่"
            : "ผู้ช่วยศาสตราจารย์ ดร.อนนท์ วิสุทธิ์ธนานนท์"),
      comment: a.comment ?? "",
      decision: a.decision,
      date: formatThaiDate(a.decidedAt),
    }));

  return {
    id: loan.id,
    statusCode: studentVisibleStatus,
    studentYear: loan.studentYear,
    advisorName: loan.advisor?.fullNameTh ?? "-",
    advisorNameEn: loan.advisor?.fullNameEn ?? undefined,
    bankName: loan.bankName ? normalizeBankName(loan.bankName) : undefined,
    bankAccountNo: loan.bankAccountNo,
    bankAccountName: loan.bankAccountName,
    requestNumber: formatRequestNumber(loan.id),
    statusLabel,
    submittedAt: formatThaiDateTime(loan.submittedAt ?? loan.createdAt),
    purposeLabel: "วัตถุประสงค์การกู้ยืม",
    purpose: loan.purpose,
    amountLabel: "จำนวนเงินที่ขอกู้",
    amount: requestedAmount.toLocaleString("th-TH"),
    additionalReasonLabel: "เหตุผลความจำเป็นเพิ่มเติม",
    additionalReason: loan.additionalNote ?? "-",
    downloadLabel: "ดาวน์โหลดแบบคำร้อง (PDF)",
    transferSlipImage: disbursementTransactionId
      ? `/api/fund-transactions/${disbursementTransactionId}/slip`
      : "",
    timeline,
    schedule,
    paymentHistory,
    approvals: mappedApprovals,
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

  for (const loan of loans) {
    if (!loan.installments || !Array.isArray(loan.installments)) continue;
    totalInstallments += loan.installments.length;
    for (const conduct of deriveInstallmentConduct(loan.installments, loan.payments)) {
      if (conduct === "on_time") onTime++;
      else if (conduct === "late") late++;
    }
  }

  if (totalInstallments === 0 || onTime + late === 0) {
    return {
      totalLoanRequests: loans.length,
      totalInstallments,
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
