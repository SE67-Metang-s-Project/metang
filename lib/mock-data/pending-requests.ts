import type { ActionRequest } from "@/components/advisor/pending/RequestsCard";

export const mockPendingRequests: ActionRequest[] = [
  {
    id: "REQ-65001", name: "สมชาย ใจดี", studentId: "65010001", major: "วิศวกรรมคอมพิวเตอร์", year: "3", objective: "ชำระค่าลงทะเบียนเรียน เนื่องจากครอบครัวมีรายได้ลดลง", amount: "45000", term: "2", submitDate: "15 ส.ค. 2567", waitDays: 5, isOverdue: false,
    history: [{ action: "ยื่นคำขอกู้ยืม", date: "15 ส.ค. 2567", actor: "สมชาย ใจดี" }],
    paymentBehavior: { onTimeStatusLabel: "ชำระตรงเวลา", onTimeInstallments: 12, lateInstallments: 0, totalLoanRequests: 2, totalInstallments: 12 },
  },
  {
    id: "REQ-65002", name: "มานี มีนา", studentId: "65010002", major: "วิทยาการคอมพิวเตอร์", year: "3", objective: "ค่าใช้จ่ายจำเป็นและอุปกรณ์การเรียน", amount: "20000", term: "3", submitDate: "10 ส.ค. 2567", waitDays: 0, isOverdue: false,
    history: [{ action: "ยื่นคำขอกู้ยืม", date: "10 ส.ค. 2567", actor: "มานี มีนา" }, { action: "อนุมัติคำร้อง", date: "12 ส.ค. 2567", actor: "อ.ที่ปรึกษา" }],
    paymentBehavior: { onTimeStatusLabel: "ค้างชำระ", onTimeInstallments: 8, lateInstallments: 2, totalLoanRequests: 3, totalInstallments: 10 },
  },
];
