// ไฟล์: src/components/shared/mockAdminRequests.ts
import { ActionRequest } from "@/components/shared/pending/RequestsCard";

export const mockAdminRequests: ActionRequest[] = [
  {
    id: "REQ-2024-0012",
    name: "สมชาย ใจดี",
    studentId: "64010123",
    major: "พยาบาลศาสตร์",
    year: "3",
    phone: "081-234-5678",
    objective: "ใช้จ่ายค่าหอพักและค่าครองชีพเนื่องจากผู้ปกครองขาดรายได้กะทันหัน",
    amount: "5000",
    term: "5",
    expectedReturnDate: "พ.ค. 2568",
    requestStatus: "pending_admin",
    submitDate: "12 ต.ค. 2567",
    waitDays: 2,
    isOverdue: false,
    bankDetails: {
      bankName: "ธนาคารไทยพาณิชย์",
      accountNumber: "123-4-56789-0",
      accountName: "นาย สมชาย ใจดี",
    },
    paymentBehavior: { totalLoanRequests: 1, onTimeInstallments: 5, lateInstallments: 0 },
    approvals: [
      {
        step: "advisor",
        actorName: "รศ.ดร. มานี มีสุข",
        comment: "นักศึกษามีความจำเป็นจริง เห็นควรให้ความช่วยเหลือเบื้องต้น",
        decision: "approved",
        date: "14 ต.ค. 2567"
      }
    ],
    history: [
      { action: "นักศึกษายื่นคำร้อง", date: "12 ต.ค. 2567 09:00", actor: "สมชาย ใจดี" },
      { action: "อ.ที่ปรึกษา อนุมัติ", date: "14 ต.ค. 2567 10:30", actor: "รศ.ดร. มานี มีสุข" }
    ],
  },
  {
    id: "REQ-2024-0020",
    name: "ดวงเดือน ดารา",
    studentId: "63050999",
    major: "วิศวกรรมซอฟต์แวร์",
    year: "4",
    phone: "089-123-4567",
    objective: "ชำระค่าธรรมเนียมการศึกษา",
    amount: "15000",
    term: "6",
    expectedReturnDate: "มิ.ย. 2568",
    requestStatus: "pending_executive", // เปลี่ยนจาก disbursement ให้มาอยู่ที่ executive เพื่อทดสอบโชว์ 2 ความเห็น
    submitDate: "05 ต.ค. 2567",
    waitDays: 5,
    isOverdue: false,
    bankDetails: {
      bankName: "ธนาคารกรุงเทพ",
      accountNumber: "987-6-54321-0",
      accountName: "นางสาว ดวงเดือน ดารา",
    },
    paymentBehavior: { totalLoanRequests: 0, onTimeInstallments: 0, lateInstallments: 0 },
    approvals: [
      {
        step: "advisor",
        actorName: "อ.ณัฐพล โค้ดดิ้ง",
        comment: "เอกสารครบถ้วน อนุมัติ",
        decision: "approved",
        date: "06 ต.ค. 2567"
      },
      {
        step: "admin",
        actorName: "สมปอง (เจ้าหน้าที่)",
        comment: "เอกสารทางการเงินและประวัติการชำระถูกต้องเรียบร้อย",
        decision: "approved",
        date: "07 ต.ค. 2567"
      }
    ],
    history: [
      { action: "นักศึกษายื่นคำร้อง", date: "05 ต.ค. 2567 09:00", actor: "ดวงเดือน ดารา" },
      { action: "อ.ที่ปรึกษา อนุมัติ", date: "06 ต.ค. 2567 10:30", actor: "อ.ณัฐพล โค้ดดิ้ง" },
      { action: "เจ้าหน้าที่ ตรวจสอบผ่าน", date: "07 ต.ค. 2567 14:00", actor: "Admin สมปอง" }
    ],
  },
  {
    id: "REQ-2024-0022",
    name: "เอกชัย ถ่ายเอกสาร",
    studentId: "65010222",
    major: "พยาบาลศาสตร์",
    year: "2",
    phone: "084-555-6666",
    objective: "ชำระค่าลงทะเบียนเรียน",
    amount: "10000",
    term: "4",
    expectedReturnDate: "มี.ค. 2568",
    requestStatus: "returned",
    submitDate: "13 ต.ค. 2567",
    waitDays: 0,
    isOverdue: false,
    bankDetails: {
      bankName: "ธนาคารไทยพาณิชย์",
      accountNumber: "111-5-55555-5",
      accountName: "นาย เอกชัย ถ่ายเอกสาร",
    },
    paymentBehavior: { totalLoanRequests: 0, onTimeInstallments: 0, lateInstallments: 0 },
    approvals: [
      {
        step: "advisor",
        actorName: "ผศ.ดร. สมศรี ดีใจ",
        comment: "เห็นควรอนุมัติ",
        decision: "approved",
        date: "14 ต.ค. 2567"
      },
      {
        step: "admin",
        actorName: "สมปอง (เจ้าหน้าที่)",
        comment: "ไฟล์เอกสารใบแจ้งหนี้เบลอมาก อ่านไม่เห็นตัวเลข กรุณาแนบใหม่",
        decision: "returned",
        date: "15 ต.ค. 2567"
      }
    ],
    history: [
      { action: "นักศึกษายื่นคำร้อง", date: "13 ต.ค. 2567 11:20", actor: "เอกชัย ถ่ายเอกสาร" },
      { action: "อ.ที่ปรึกษา อนุมัติ", date: "14 ต.ค. 2567 15:00", actor: "ผศ.ดร. สมศรี ดีใจ" },
      { action: "เจ้าหน้าที่ ส่งกลับแก้ไข", date: "15 ต.ค. 2567 09:30", actor: "Admin สมปอง" }
    ],
  }
];