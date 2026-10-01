import { withBasePath } from "@/lib/base-path";
import { bangkokParts } from "@/lib/date";
import { getEducationLevelCode, getEducationLevelName } from "@/lib/student-code";
import { deriveInstallmentConduct, type ConductInstallment, type ConductPayment } from "@/lib/repayment-conduct";
import type {
  ActionHistory,
  ActionRequest,
  ApprovalStep,
  PaymentBehaviorInfo,
} from "@/components/shared/pending/RequestsCard";

/**
 * What a staff page's UI reads. Server pages serialize every field they return into the HTML, so a
 * field is only produced when the page's UI shows it.
 */
export type ActionRequestView = {
  bank: boolean;
  slipLinks: boolean;
  schedule: boolean;
  conduct: boolean;
  /** Verify-slip pages: only the fields VerifySlipCard reads. */
  verifySlip?: boolean;
};

export type StudentConduct = { totalLoanRequests: number; onTime: number; late: number };

export type ActionRequestRow = {
  id: string;
  studentYear: number;
  purpose: string;
  amount: number;
  approvedAmount: number | null;
  installmentCount: number;
  status: string;
  submittedAt: Date | null;
  createdAt: Date;
  cancelledAt: Date | null;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  // The borrower, as copied onto the loan at submit.
  studentCode: string;
  studentNameTh: string;
  studentPhone: string | null;
  studentEducationLevel: string | null;
  advisor?: { fullNameTh: string } | null;
  approvals?: {
    step: "advisor" | "admin" | "executive";
    decision: "approved" | "rejected" | "returned" | "pending";
    comment: string | null;
    decidedAt: Date | null;
    createdAt: Date;
    decider: { fullNameTh: string } | null;
  }[];
  installments?: (ConductInstallment & { id: bigint; dueDate: Date; settledAt: Date | null })[];
  payments?: {
    id: string;
    installmentId: bigint | null;
    status: string;
    amount: number;
    paidAt: Date | null;
    confirmedAt: Date | null;
    createdAt: Date;
    reviewNote: string | null;
    slipPath: string | null;
  }[];
  fundTransactions?: { id: bigint }[];
};

const THAI_MONTH_ABBRS = [
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
] as const;

// Bangkok wall clock whatever the server's time zone: a host often runs UTC, so getHours() and
// getDate() would show every time 7 hours early and put 00:00-06:59 submissions on the wrong day.
function formatThaiDate(date: Date): string {
  const { day, month, year } = bangkokParts(date);
  return `${day} ${THAI_MONTH_ABBRS[month - 1]} ${year + 543}`;
}

function formatThaiTime(date: Date): string {
  const { hour, minute } = bangkokParts(date);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} น.`;
}

function formatThaiDateTime(date: Date): string {
  const { day, month, year, hour, minute } = bangkokParts(date);
  return `${day} ${THAI_MONTH_ABBRS[month - 1]} ${year + 543} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * On-time and late counts over all of a student's loans, by the student dashboard's rule: judged
 * by transfer date, not by settledAt (review time).
 */
export function summarizeStudentConduct(
  loans: { installments: ConductInstallment[]; payments: ConductPayment[] }[],
  totalLoanRequests: number,
): StudentConduct {
  let onTime = 0;
  let late = 0;
  for (const loan of loans) {
    for (const conduct of deriveInstallmentConduct(loan.installments, loan.payments)) {
      if (conduct === "on_time") onTime += 1;
      else if (conduct === "late") late += 1;
    }
  }
  return { totalLoanRequests, onTime, late };
}

/**
 * Conduct from loans a page already loaded, for pages whose `where` covers every loan that can have
 * installments (disbursed or closed), so no second read is needed. `totals` counts all of a
 * student's loans, drafts included, as the per-student query always did.
 */
export function conductFromRows(
  rows: {
    studentCode: string;
    installments?: ConductInstallment[];
    payments?: (ConductPayment & { status: string })[];
  }[],
  totals: { studentCode: string; count: number }[],
): Map<string, StudentConduct> {
  const loansByStudent = new Map<string, { installments: ConductInstallment[]; payments: ConductPayment[] }[]>();
  for (const row of rows) {
    const loans = loansByStudent.get(row.studentCode) ?? [];
    loansByStudent.set(row.studentCode, loans);
    loans.push({
      installments: row.installments ?? [],
      payments: (row.payments ?? []).filter((payment) => payment.status === "confirmed"),
    });
  }
  return new Map(
    totals.map(({ studentCode, count }) => [
      studentCode,
      summarizeStudentConduct(loansByStudent.get(studentCode) ?? [], count),
    ]),
  );
}

function toPaymentBehavior({ totalLoanRequests, onTime, late }: StudentConduct): PaymentBehaviorInfo {
  return {
    totalLoanRequests,
    onTimeInstallments: onTime,
    lateInstallments: late,
    totalInstallments: onTime + late,
    onTimeStatusLabel:
      onTime + late === 0 ? "ยังไม่มีประวัติการชำระเงิน" : late === 0 ? "ชำระตรงเวลา" : "ชำระล่าช้า",
  };
}

const approverFallback = { advisor: "อาจารย์ที่ปรึกษา", admin: "ผู้ดูแลระบบ", executive: "ผู้บริหาร" } as const;

const approvalActionLabel = {
  advisor: {
    approved: "อาจารย์ที่ปรึกษาพิจารณาเห็นชอบ",
    returned: "ส่งกลับให้นักศึกษาแก้ไข",
    rejected: "อาจารย์ที่ปรึกษาไม่อนุมัติ",
  },
  admin: {
    approved: "ผู้ดูแลระบบตรวจสอบเอกสารครบถ้วน",
    returned: "ผู้ดูแลระบบส่งกลับแก้ไข",
    rejected: "ผู้ดูแลระบบไม่อนุมัติ",
  },
  executive: {
    approved: "ผู้บริหารอนุมัติคำร้อง",
    returned: "ผู้บริหารส่งกลับแก้ไข",
    rejected: "ผู้บริหารไม่อนุมัติ",
  },
} as const;

export function toActionRequest(
  row: ActionRequestRow,
  view: ActionRequestView,
  conduct: StudentConduct | undefined,
  now: Date = new Date(),
): ActionRequest {
  const student = {
    fullNameTh: row.studentNameTh,
    studentCode: row.studentCode,
    phone: row.studentPhone,
    educationLevel: row.studentEducationLevel,
  };
  const installmentRows = row.installments ?? [];
  const submitDateObj = row.submittedAt ?? row.createdAt;
  const waitDays = Math.max(
    0,
    Math.floor((now.getTime() - submitDateObj.getTime()) / (1000 * 60 * 60 * 24)),
  );

  const decided = (row.approvals ?? []).filter((a) => a.decision !== "pending");
  const history: ActionHistory[] = [
    {
      action: "ยื่นคำร้องขอกู้ยืม",
      date: formatThaiDateTime(submitDateObj),
      actor: student.fullNameTh,
    },
    ...decided.map((a) => ({
      action:
        row.status === "cancelled" && a.step === "admin" && a.decision === "rejected"
          ? "ผู้ดูแลระบบยกเลิกคำร้อง"
          : approvalActionLabel[a.step][a.decision as "approved" | "returned" | "rejected"],
      date: formatThaiDateTime(a.decidedAt ?? a.createdAt),
      actor: a.decider?.fullNameTh ?? approverFallback[a.step],
      comment: a.comment ?? undefined,
    })),
  ];
  if (row.cancelledAt && !row.approvals?.some((a) => a.step === "admin" && a.decision === "rejected")) {
    history.push({
      action: "ยกเลิกคำร้อง",
      date: formatThaiDateTime(row.cancelledAt),
      // Only the student cancels their own request.
      actor: student.fullNameTh,
    });
  }

  const approvals: ApprovalStep[] = decided.map((a) => ({
    step: a.step,
    actorName: a.decider?.fullNameTh ?? approverFallback[a.step],
    comment: a.comment ?? "",
    decision: a.decision,
    date: formatThaiDate(a.decidedAt ?? a.createdAt),
  }));

  const compact = view.verifySlip === true;
  const totalOutstandingAmount = installmentRows.reduce(
    (sum, i) => sum + Math.max(0, i.amountDue - i.amountPaid),
    0,
  );
  const paymentAttemptsByInstallment = new Map<number, number>();
  const paymentHistory = (row.payments ?? []).map((p) => {
    const installmentNumber = installmentRows.find((i) => i.id === p.installmentId)?.seq ?? 1;
    const attemptNumber = (paymentAttemptsByInstallment.get(installmentNumber) ?? 0) + 1;
    paymentAttemptsByInstallment.set(installmentNumber, attemptNumber);
    return {
      id: p.id,
      installmentNumber,
      attemptNumber,
      amount: String(p.amount),
      paidAt: formatThaiDate(p.paidAt ?? p.createdAt),
      paidTime: formatThaiTime(p.paidAt ?? p.createdAt),
      ...(compact || !p.confirmedAt ? {} : { reviewedAt: formatThaiDate(p.confirmedAt) }),
      status: p.status === "confirmed" ? "verified" : p.status === "pending_review" ? "pending" : p.status,
      // The reviewer's reason for a rejection, shown in the verify-slip modal.
      reviewNote: p.reviewNote ?? undefined,
      isOverpayment: p.status === "pending_review" && p.amount > totalOutstandingAmount,
      // The route, not the storage path: these props are serialized to the browser, and a bare
      // bucket path in an <img src> renders nothing. The 302 re-runs authorization per load.
      ...(view.slipLinks ? { slipImageUrl: p.slipPath ? withBasePath(`/api/payments/${p.id}/slip`) : "" } : {}),
    };
  });

  const installments = installmentRows.map((inst) => ({
    installmentNumber: inst.seq,
    dueDate: formatThaiDate(inst.dueDate),
    amount: String(inst.amountDue),
    paidAmount: String(inst.amountPaid),
    ...(compact ? {} : { isPaid: inst.settledAt !== null || inst.amountPaid >= inst.amountDue }),
  }));

  const disbursement = row.fundTransactions?.[0];

  return {
    id: row.id,
    name: student.fullNameTh,
    studentId: student.studentCode ?? "-",
    major: "พยาบาลศาสตร์",
    degree: getEducationLevelName(student.educationLevel ?? getEducationLevelCode(student.studentCode)) || "-",
    year: String(row.studentYear),
    phone: student.phone ?? "-",
    objective: row.purpose,
    amount: String(row.amount),
    term: String(row.installmentCount),
    submitDate: formatThaiDate(submitDateObj),
    requestStatus: row.status,
    // Verify-slip reads only the submit time, taken from the first history entry.
    history: compact ? history.slice(0, 1) : history,
    paymentHistory,
    installments,
    ...(compact
      ? {}
      : {
          program: "พยาบาลศาสตรบัณฑิต",
          educationLevel: getEducationLevelName(student.educationLevel) ?? undefined,
          advisorName: row.advisor?.fullNameTh ?? undefined,
          approvedAmount: row.approvedAmount,
          submitTime: formatThaiTime(submitDateObj),
          submittedAt: submitDateObj.toISOString(),
          waitDays,
          isOverdue: waitDays > 7,
          approvals,
        }),
    ...(view.bank
      ? {
          bankDetails: {
            bankName: row.bankName ?? "",
            accountNumber: row.bankAccountNo ?? "",
            accountName: row.bankAccountName ?? "",
          },
        }
      : {}),
    ...(view.conduct && conduct ? { paymentBehavior: toPaymentBehavior(conduct) } : {}),
    ...(view.slipLinks && !compact && disbursement
      ? { slipUrl: withBasePath(`/api/fund-transactions/${disbursement.id}/slip`) }
      : {}),
  };
}
