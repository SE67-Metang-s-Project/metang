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
    requestStatus: "รอเจ้าหน้าที่ตรวจสอบ", // สถานะนี้ทำให้ปุ่ม "ตรวจสอบ" ของ Admin ทำงาน
    submitDate: "12 ต.ค. 2567",
    waitDays: 2,
    isOverdue: false,
    advisorName: "รศ.ดร. มานี มีสุข",
    advisorComment: "นักศึกษามีความจำเป็นจริง เห็นควรให้ความช่วยเหลือเบื้องต้น",
    bankDetails: {
      bankName: "ธนาคารไทยพาณิชย์",
      accountNumber: "123-4-56789-0",
      accountName: "นาย สมชาย ใจดี",
    },
    paymentBehavior: {
      totalLoanRequests: 1,
      onTimeInstallments: 0,
      lateInstallments: 0,
    },
    history: [
      { action: "นักศึกษายื่นคำร้อง", date: "12 ต.ค. 2567 09:00", actor: "สมชาย ใจดี" },
      { action: "อ.ที่ปรึกษา อนุมัติ", date: "14 ต.ค. 2567 10:30", actor: "รศ.ดร. มานี มีสุข" }
    ],
  },
  {
    id: "REQ-2024-0008",
    name: "วิภาดา รักเรียน",
    studentId: "63010456",
    major: "พยาบาลศาสตร์",
    year: "4",
    phone: "089-876-5432",
    objective: "ซื้ออุปกรณ์การแพทย์สำหรับการฝึกปฏิบัติงานบนหอผู้ป่วย",
    amount: "3500",
    term: "3",
    expectedReturnDate: "ก.พ. 2568",
    requestStatus: "รอผู้บริหารอนุมัติ", // Admin ส่งต่อแล้ว จะขึ้นเป็นป้ายสีฟ้าแทนปุ่มกด
    submitDate: "10 ต.ค. 2567",
    waitDays: 4,
    isOverdue: false,
    advisorName: "ผศ.ดร. สมศรี ดีใจ",
    advisorComment: "อุปกรณ์จำเป็นต่อการฝึกปฏิบัติงาน อนุมัติ",
    bankDetails: {
      bankName: "ธนาคารกสิกรไทย",
      accountNumber: "098-7-65432-1",
      accountName: "นางสาว วิภาดา รักเรียน",
    },
    history: [
      { action: "นักศึกษายื่นคำร้อง", date: "10 ต.ค. 2567 11:20", actor: "วิภาดา รักเรียน" },
      { action: "อ.ที่ปรึกษา อนุมัติ", date: "11 ต.ค. 2567 15:00", actor: "ผศ.ดร. สมศรี ดีใจ" },
      { action: "เจ้าหน้าที่ ตรวจสอบผ่าน", date: "12 ต.ค. 2567 09:30", actor: "Admin สมปอง" }
    ],
  }
];