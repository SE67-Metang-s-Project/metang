import type { ActionRequest } from "@/components/shared/pending/RequestsCard";

/**
 * กรองเฉพาะนักศึกษาที่ admin โอนเงินให้เรียบร้อยแล้ว (disbursed) และยังมีหนี้คงค้าง (remainingBalance > 0)
 * พร้อมตัดรายการซ้ำตามรหัสนักศึกษา (studentId)
 * ใช้สำหรับหน้านักศึกษาในความดูแลทั้ง role advisor และ executive
 */
export function filterAdvisorStudents(requests: ActionRequest[]): ActionRequest[] {
  const seen = new Set<string>();
  const uniqueReqs: ActionRequest[] = [];

  const activeRequests = requests.filter((req) => {
    if (req.requestStatus !== "disbursed") return false;
    const totalDue =
      req.installments && req.installments.length > 0
        ? req.installments.reduce(
            (sum, inst) => sum + (Number(String(inst.amount).replace(/,/g, "")) || 0),
            0,
          )
        : Number(String(req.approvedAmount ?? req.amount ?? 0).replace(/,/g, "")) || 0;
    const totalPaid =
      req.installments && req.installments.length > 0
        ? req.installments.reduce(
            (sum, inst) => sum + (Number(String(inst.paidAmount || 0).replace(/,/g, "")) || 0),
            0,
          )
        : 0;
    const remainingBalance = Math.max(0, totalDue - totalPaid);
    return remainingBalance > 0;
  });

  for (const req of activeRequests) {
    if (!seen.has(req.studentId)) {
      seen.add(req.studentId);
      uniqueReqs.push(req);
    }
  }

  return uniqueReqs;
}

export const filterSupervisedStudents = filterAdvisorStudents;
