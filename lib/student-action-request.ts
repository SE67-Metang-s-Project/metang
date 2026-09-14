import type {
  ActionRequest,
  ApprovalStep,
  InstallmentRecord,
  PaymentHistoryRecord,
  ActionHistory,
} from "@/components/shared/disburse-debt/DisburseDebtCard";
import type { LoanDetails } from "@/app/student/studentMockData";
import type { StudentProfileDisplay } from "@/components/student/dashboard/LoanSummaryCard";

export function mapStudentLoanToActionRequest(
  details: LoanDetails,
  profile?: StudentProfileDisplay & { phoneNumber?: string },
): ActionRequest {
  const effectiveProfile = profile || {
    displayName: details.bankAccountName || "นักศึกษา",
    studentId: "-",
    programName: "พยาบาลศาสตรบัณฑิต",
    educationLevel: "ปริญญาตรี",
  };

  const rawDate = details.submittedAt ? details.submittedAt.replace(/^ยื่นเมื่อ\s*/, "").trim() : "";
  const dateParts = rawDate.split(" ");
  const submitDate =
    dateParts.length >= 3 ? `${dateParts[0]} ${dateParts[1]} ${dateParts[2]}` : (rawDate || "-");

  const cleanAmount = String(details.amount || "0").replace(/[^\d.]/g, "");

  // Approvals
  const approvals: ApprovalStep[] = [];
  if (details.approvals && details.approvals.length > 0) {
    approvals.push(...details.approvals);
  } else if (details.timeline && details.timeline.length > 0) {
    for (const item of details.timeline) {
      if (item.title.includes("อาจารย์")) {
        approvals.push({
          step: "advisor",
          actorName: item.actor || details.advisorName || "อาจารย์ที่ปรึกษา",
          comment: item.comment || "",
          decision: item.title.includes("ไม่อนุมัติ")
            ? "rejected"
            : item.title.includes("แก้ไข")
              ? "returned"
              : "approved",
          date: item.dateTime ? item.dateTime.split(" ").slice(0, 3).join(" ") : submitDate,
        });
      } else if (item.title.includes("เจ้าหน้าที่") && !item.title.includes("โอนเงิน")) {
        approvals.push({
          step: "admin",
          actorName: item.actor || "เจ้าหน้าที่",
          comment: item.comment || "",
          decision: item.title.includes("ไม่อนุมัติ")
            ? "rejected"
            : item.title.includes("แก้ไข")
              ? "returned"
              : "approved",
          date: item.dateTime ? item.dateTime.split(" ").slice(0, 3).join(" ") : submitDate,
        });
      } else if (item.title.includes("ผู้บริหาร")) {
        approvals.push({
          step: "executive",
          actorName: item.actor || "ผู้ช่วยศาสตราจารย์ ดร.อนนท์ วิสุทธิ์ธนานนท์",
          comment: item.comment || "",
          decision: item.title.includes("ไม่อนุมัติ")
            ? "rejected"
            : item.title.includes("แก้ไข")
              ? "returned"
              : "approved",
          date: item.dateTime ? item.dateTime.split(" ").slice(0, 3).join(" ") : submitDate,
        });
      }
    }
  }

  // Installments
  const installments: InstallmentRecord[] = (details.schedule || []).map((s) => {
    const paidRecord = details.paymentHistory?.find(
      (p) => p.installmentNumber === s.installmentNumber && p.status === "verified",
    );
    const isPaid = Boolean(paidRecord);
    const cleanPaidDate = paidRecord?.paidAt
      ? paidRecord.paidAt.replace(/^ชำระเมื่อ\s*/, "").split(" ").slice(0, 3).join(" ")
      : undefined;

    return {
      installmentNumber: s.installmentNumber,
      dueDate: s.dueDateLabel.replace(/^ครบกำหนด\s*/, "").trim(),
      amount: s.amount.replace(/[^\d.]/g, ""),
      paidAmount: isPaid ? s.amount.replace(/[^\d.]/g, "") : "0",
      isPaid,
      paidDate: cleanPaidDate,
    };
  });

  // Payment History
  const paymentHistory: PaymentHistoryRecord[] = (details.paymentHistory || []).map((p) => {
    const matchingSchedule = details.schedule?.find((s) => s.installmentNumber === p.installmentNumber);
    const dueDate = matchingSchedule ? matchingSchedule.dueDateLabel.replace(/^ครบกำหนด\s*/, "").trim() : undefined;
    const cleanPaidAt = p.paidAt.replace(/^ชำระเมื่อ\s*/, "").split(" ").slice(0, 3).join(" ");

    return {
      installmentNumber: p.installmentNumber,
      amount: p.amount.replace(/[^\d.]/g, ""),
      dueDate,
      paidDate: cleanPaidAt,
      paidAt: cleanPaidAt,
      status: p.status === "verified" ? "verified" : "pending",
    };
  });

  // History / Timeline
  const history: ActionHistory[] = (details.timeline || []).map((t) => ({
    action: t.title,
    date: t.dateTime,
    actor: t.actor || "",
  }));

  let year = "3";
  if (details.studentYear) {
    year = String(details.studentYear);
  } else if (effectiveProfile.yearLabel) {
    const match = effectiveProfile.yearLabel.match(/\d+/);
    if (match) year = match[0];
  }

  const expectedReturnDate =
    details.schedule && details.schedule.length > 0
      ? details.schedule[details.schedule.length - 1].dueDateLabel.replace(/^ครบกำหนด\s*/, "").trim()
      : undefined;

  return {
    id: details.requestNumber || details.id || "",
    name: effectiveProfile.displayName || details.bankAccountName || "นักศึกษา",
    studentId: effectiveProfile.studentId || "-",
    major: "พยาบาลศาสตร์",
    program: effectiveProfile.programName || "พยาบาลศาสตรบัณฑิต",
    degree: effectiveProfile.educationLevel || "ปริญญาตรี",
    educationLevel: effectiveProfile.educationLevel,
    year,
    phone: effectiveProfile.phoneNumber || details.contact?.phone || "-",
    advisorName:
      details.advisorName || approvals.find((a) => a.step === "advisor")?.actorName || "อาจารย์ที่ปรึกษา",
    objective: details.purpose || "",
    additionalNote:
      details.additionalReason && details.additionalReason !== "-" ? details.additionalReason : "",
    amount: cleanAmount,
    term: String(details.schedule?.length || 1),
    expectedReturnDate,
    submitDate,
    requestStatus: details.statusCode || "pending",
    bankDetails: {
      bankName: details.bankName || "ธนาคารไทยพาณิชย์",
      accountNumber: details.bankAccountNo || "-",
      accountName: details.bankAccountName || effectiveProfile.displayName || "นักศึกษา",
    },
    approvals,
    installments,
    paymentHistory,
    history,
    documentUrl: details.documentUrl,
    slipUrl: details.transferSlipImage,
  };
}
