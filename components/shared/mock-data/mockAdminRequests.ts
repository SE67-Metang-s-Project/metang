// เปลี่ยน Path ให้ชี้ไปที่โฟลเดอร์ shared ที่เราเพิ่งย้ายไป
import { ActionRequest } from "@/components/shared/verify-slip/VerifySlipCard";

// ใส่ Type : ActionRequest[] เพื่อให้ TypeScript ตรวจสอบความถูกต้องของข้อมูล
export const mockAdminRequests: ActionRequest[] = [
  // ==========================================
  // สถานะ: รอตรวจสอบ (pending_admin)
  // ==========================================
  {
    id: "REQ-2609-101",
    name: "นายใจดี มีสุข",
    studentId: "650610999",
    major: "พยาบาลศาสตร์",
    program: "พยาบาลศาสตรบัณฑิต",
    year: "3",
    phone: "081-111-2222",
    objective: "เพื่อเป็นค่าใช้จ่ายในการซื้ออุปกรณ์การเรียนและหนังสือ",
    amount: "4500",
    term: "3",
    submitDate: "5 ก.ย. 2569",
    requestStatus: "pending_admin",
    history: [
      { action: "ยื่นคำร้อง", date: "5 ก.ย. 2569 08:00", actor: "ใจดี มีสุข" },
      { action: "อนุมัติโดยอาจารย์ที่ปรึกษา", date: "6 ก.ย. 2569 10:00", actor: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ" }
    ]
  },

  // ==========================================
  // สถานะ: รอโอนเงิน (pending_disbursement)
  // ==========================================
  {
    id: "REQ-2609-001",
    name: "นางสาวสมหญิง รักเรียน",
    studentId: "650610012",
    major: "พยาบาลศาสตร์",
    program: "พยาบาลศาสตรบัณฑิต",
    year: "3",
    phone: "081-234-5678",
    objective: "เพื่อเป็นค่าใช้จ่ายในการทำวิจัยและฝึกปฏิบัติงานบนหอผู้ป่วย",
    amount: "5000",
    term: "3",
    submitDate: "1 ก.ย. 2569",
    requestStatus: "pending_disbursement",
    bankDetails: {
      bankName: "ธนาคารไทยพาณิชย์",
      accountNumber: "123-4-56789-0",
      accountName: "นางสาวสมหญิง รักเรียน"
    },
    history: [
      { action: "ยื่นคำร้อง", date: "1 ก.ย. 2569 09:00", actor: "สมหญิง รักเรียน" },
      { action: "อนุมัติโดยอาจารย์ที่ปรึกษา", date: "2 ก.ย. 2569 10:30", actor: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ" },
      { action: "เจ้าหน้าที่ตรวจสอบผ่าน", date: "3 ก.ย. 2569 14:00", actor: "เจ้าหน้าที่ สมศรี" },
      { action: "ผู้บริหารอนุมัติวงเงิน", date: "4 ก.ย. 2569 11:15", actor: "รศ.ดร. ประเสริฐ กิตติคุณ" }
    ]
  },
  {
    id: "REQ-2609-002",
    name: "นายมานะ อดทน",
    studentId: "660610055",
    major: "พยาบาลศาสตร์",
    program: "พยาบาลศาสตรบัณฑิต",
    year: "2",
    phone: "089-876-5432",
    objective: "เป็นค่าใช้จ่ายฉุกเฉินสำหรับค่าหอพักและอุปกรณ์การแพทย์เบื้องต้น",
    amount: "3000",
    term: "2",
    submitDate: "28 ส.ค. 2569",
    requestStatus: "pending_disbursement",
    bankDetails: {
      bankName: "ธนาคารกสิกรไทย",
      accountNumber: "098-7-65432-1",
      accountName: "นายมานะ อดทน"
    },
    history: [
      { action: "ยื่นคำร้อง", date: "28 ส.ค. 2569 13:45", actor: "มานะ อดทน" },
      { action: "อนุมัติโดยอาจารย์ที่ปรึกษา", date: "29 ส.ค. 2569 09:30", actor: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ" },
      { action: "เจ้าหน้าที่ตรวจสอบผ่าน", date: "30 ส.ค. 2569 10:00", actor: "เจ้าหน้าที่ สมศรี" },
      { action: "ผู้บริหารอนุมัติวงเงิน", date: "31 ส.ค. 2569 15:20", actor: "รศ.ดร. ประเสริฐ กิตติคุณ" }
    ]
  },

  // ==========================================
  // สถานะ: โอนเงินแล้ว (disbursed)
  // ==========================================
  {
    id: "REQ-2608-114",
    name: "นางสาวใจดี เรียนเก่ง",
    studentId: "640610111",
    major: "พยาบาลศาสตร์",
    program: "พยาบาลศาสตรบัณฑิต",
    year: "4",
    phone: "082-345-6789",
    objective: "จ่ายค่าหอพักและค่าครองชีพระหว่างรอทุนการศึกษาของมหาวิทยาลัย",
    amount: "10000",
    term: "6",
    submitDate: "15 ส.ค. 2569",
    requestStatus: "disbursed",
    bankDetails: {
      bankName: "ธนาคารกรุงไทย",
      accountNumber: "111-2-33344-5",
      accountName: "นางสาวใจดี เรียนเก่ง"
    },
    history: [
      { action: "ยื่นคำร้อง", date: "15 ส.ค. 2569 08:30", actor: "ใจดี เรียนเก่ง" },
      { action: "อนุมัติโดยอาจารย์ที่ปรึกษา", date: "16 ส.ค. 2569 11:00", actor: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ" },
      { action: "เจ้าหน้าที่ตรวจสอบผ่าน", date: "17 ส.ค. 2569 14:20", actor: "เจ้าหน้าที่ สมศรี" },
      { action: "ผู้บริหารอนุมัติวงเงิน", date: "18 ส.ค. 2569 10:15", actor: "รศ.ดร. ประเสริฐ กิตติคุณ" },
      { action: "เบิกจ่ายเงินสำเร็จ", date: "19 ส.ค. 2569 13:45", actor: "เจ้าหน้าที่ สมศรี" }
    ],
    // เพิ่มประวัติการชำระเงินเข้ามา เพื่อให้หน้า "ตรวจสอบสลิป" ใช้งานได้ด้วย
    paymentHistory: [
      {
        id: "PAY-001",
        installmentNumber: 1,
        amount: "1666.67",
        paidAt: "25 ส.ค. 2569",
        paidTime: "14:30",
        status: "verified",
        slipImageUrl: "https://placehold.co/400x600/f8fafc/a1a1aa?text=Slip+Verified"
      },
      {
        id: "PAY-002",
        installmentNumber: 2,
        amount: "1666.67",
        paidAt: "2 ก.ย. 2569",
        paidTime: "10:00",
        status: "pending",
        slipImageUrl: "https://placehold.co/400x600/f8fafc/a1a1aa?text=Slip+Pending"
      }
    ]
  }
];