// ไฟล์: src/data/mockRequests.ts

// 1. ย้าย Type ทั้งหมดมาไว้ที่นี่ และ Export ออกไป
export type StudentInfo = {
  name: string;
  studentId: string;
  major: string;
  year: string;
};

export type LoanDetails = {
  objective: string;
  amount: string;
  term: string;
};

export type ActionHistory = {
  action: string;
  date: string;
  actor: string;
};

export type RequestStatus = {
  submitDate: string;
  waitDays: number;
  isOverdue: boolean;
  history: ActionHistory[];
};

export type PaymentBehaviorInfo = {
  onTimeStatusLabel?: string;
  onTimeInstallments?: number;
  lateInstallments?: number;
  totalLoanRequests?: number;
  totalInstallments?: number;
};

export type ActionRequest = StudentInfo & LoanDetails & RequestStatus & {
  id: string;
  paymentBehavior?: PaymentBehaviorInfo;
};

// 2. ย้ายตัวแปร mockRequests มาไว้ที่นี่ และ Export ออกไป
export const mockRequests: ActionRequest[] = [
  {
    id: "SL-2026-000104",
    name: "ธีรภัทร วัฒนา",
    studentId: "651210103",
    major: "พยาบาลศาสตรบัณฑิต",
    year: "3",
    objective: "ค่าเทอมและค่าใช้จ่ายในการฝึกงานภาคสนาม",
    amount: "3,000",
    term: "3",
    submitDate: "1 ส.ค. 2569",
    waitDays: 8,
    isOverdue: true,
    history: [
      { action: "ยื่นคำขอกู้ยืม", date: "1 ส.ค. 2569", actor: "ธีรภัทร วัฒนา" }
    ],
    paymentBehavior: {
      onTimeStatusLabel: "ชำระตรงเวลา",
      onTimeInstallments: 12,
      lateInstallments: 0,
      totalLoanRequests: 4,
      totalInstallments: 12,
    }
  },
  {
    id: "SL-2026-000102",
    name: "ปิยะพงษ์ สุขใจ",
    studentId: "651210042",
    major: "พยาบาลศาสตรบัณฑิต",
    year: "2",
    objective: "ค่าใช้จ่ายส่วนตัว",
    amount: "2,500",
    term: "2",
    submitDate: "5 ส.ค. 2569",
    waitDays: 5,
    isOverdue: false,
    history: [
      { action: "ยื่นคำขอกู้ยืม", date: "5 ส.ค. 2569", actor: "ปิยะพงษ์ สุขใจ" },
      { action: "เจ้าหน้าที่ตรวจสอบเอกสาร", date: "6 ส.ค. 2569", actor: "เจ้าหน้าที่ สมศรี" }
    ],
    paymentBehavior: {
      onTimeStatusLabel: "ชำระตรงเวลา",
      onTimeInstallments: 6,
      lateInstallments: 0,
      totalLoanRequests: 2,
      totalInstallments: 6,
    }
  },
];