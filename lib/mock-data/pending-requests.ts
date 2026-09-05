import type { ActionRequest } from "@/components/shared/pending/RequestsCard";

export const mockPendingRequests: ActionRequest[] = [
  {
    id: "REQ-67001", name: "สมชาย ใจดี", studentId: "670510702", major: "พยาบาลศาสตร์บัณฑิต", degree: "ปริญญาโท", year: "3", requestStatus: "รอพิจารณา", objective: "ชำระค่าลงทะเบียนเรียน เนื่องจากครอบครัวมีรายได้ลดลง", amount: "45000", term: "2", submitDate: "15 ส.ค. 2567", submitTime: "09:15 น.", waitDays: 5, isOverdue: false,
    history: [{ action: "ยื่นคำขอกู้ยืม", date: "15 ส.ค. 2567", actor: "สมชาย ใจดี" }],
    paymentBehavior: { onTimeStatusLabel: "ชำระตรงเวลา", onTimeInstallments: 12, lateInstallments: 0, totalLoanRequests: 2, totalInstallments: 12 },
  },
  {
    id: "REQ-67002", name: "มานี มีนา", studentId: "670510703", major: "พยาบาลศาสตร์บัณฑิต", degree: "ปริญญาตรี", year: "2", requestStatus: "อนุมัติแล้ว", objective: "ค่าใช้จ่ายจำเป็นและอุปกรณ์การเรียน", amount: "20000", term: "3", submitDate: "10 ส.ค. 2567", submitTime: "14:30 น.", waitDays: 0, isOverdue: false,
    history: [{ action: "ยื่นคำขอกู้ยืม", date: "10 ส.ค. 2567", actor: "มานี มีนา" }, { action: "อนุมัติคำร้อง", date: "12 ส.ค. 2567", actor: "อ.ที่ปรึกษา" }],
    paymentBehavior: { onTimeStatusLabel: "ค้างชำระ", onTimeInstallments: 8, lateInstallments: 2, totalLoanRequests: 3, totalInstallments: 10 },
  },
  {
    id: "REQ-67003", name: "วิภา สายใจ", studentId: "670510704", major: "สาธารณสุขศาสตร์", degree: "ปริญญาตรี", year: "4", requestStatus: "ไม่อนุมัติ", objective: "ขอทุนสำหรับค่าอุปกรณ์การเรียนและค่าเดินทาง", amount: "18000", term: "3", submitDate: "9 ส.ค. 2567", submitTime: "11:05 น.", waitDays: 0, isOverdue: false,
    history: [{ action: "ยื่นคำขอกู้ยืม", date: "9 ส.ค. 2567", actor: "วิภา สายใจ" }, { action: "ไม่อนุมัติคำร้อง", date: "11 ส.ค. 2567", actor: "ผู้บริหาร" }],
    paymentBehavior: { onTimeStatusLabel: "ชำระตรงเวลา", onTimeInstallments: 8, lateInstallments: 0, totalLoanRequests: 1, totalInstallments: 8 },
  },
  {
    id: "REQ-67004", name: "กิตติพงษ์ รุ่งเรือง", studentId: "670510705", major: "พยาบาลศาสตร์บัณฑิต", degree: "ปริญญาโท", year: "1", requestStatus: "ยกเลิกคำร้อง", objective: "ขอความช่วยเหลือค่าใช้จ่ายระหว่างฝึกปฏิบัติงาน", amount: "35000", term: "4", submitDate: "8 ส.ค. 2567", submitTime: "16:20 น.", waitDays: 0, isOverdue: false,
    history: [{ action: "ยื่นคำขอกู้ยืม", date: "8 ส.ค. 2567", actor: "กิตติพงษ์ รุ่งเรือง" }, { action: "ยกเลิกคำร้อง", date: "10 ส.ค. 2567", actor: "นักศึกษา" }],
    paymentBehavior: { onTimeStatusLabel: "ชำระตรงเวลา", onTimeInstallments: 15, lateInstallments: 0, totalLoanRequests: 2, totalInstallments: 15 },
  },
  {
    id: "REQ-67005", name: "พรนภา แสงทอง", studentId: "670510706", major: "กายภาพบำบัด", degree: "ปริญญาตรี", year: "3", requestStatus: "รอพิจารณา", objective: "ชำระค่าหอพักและค่าใช้จ่ายจำเป็นในภาคการศึกษา", amount: "28000", term: "3", submitDate: "7 ส.ค. 2567", submitTime: "08:45 น.", waitDays: 3, isOverdue: false,
    history: [{ action: "ยื่นคำขอกู้ยืม", date: "7 ส.ค. 2567", actor: "พรนภา แสงทอง" }],
    paymentBehavior: { onTimeStatusLabel: "ชำระตรงเวลา", onTimeInstallments: 6, lateInstallments: 0, totalLoanRequests: 1, totalInstallments: 6 },
  },
  {
    id: "REQ-67006", name: "ณัฐวุฒิ บุญมี", studentId: "670510707", major: "พยาบาลศาสตร์บัณฑิต", degree: "ปริญญาตรี", year: "4", requestStatus: "อนุมัติแล้ว", objective: "ชำระค่าเล่าเรียนและอุปกรณ์สำหรับการฝึกปฏิบัติ", amount: "40000", term: "4", submitDate: "5 ส.ค. 2567", submitTime: "13:10 น.", waitDays: 0, isOverdue: false,
    history: [{ action: "ยื่นคำขอกู้ยืม", date: "5 ส.ค. 2567", actor: "ณัฐวุฒิ บุญมี" }, { action: "อนุมัติคำร้อง", date: "7 ส.ค. 2567", actor: "ผู้บริหาร" }],
    paymentBehavior: { onTimeStatusLabel: "ชำระตรงเวลา", onTimeInstallments: 18, lateInstallments: 0, totalLoanRequests: 3, totalInstallments: 18 },
  },
];
