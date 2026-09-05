// src/components/shared/mock-data/mockDisburseRequests.ts

// เปลี่ยน Path ให้ตรงกับที่เก็บไฟล์ DisburseDebtCard.tsx ของคุณ
import { ActionRequest } from "@/components/shared/disburse-debt/DisburseDebtCard";

export const mockDisburseRequests: ActionRequest[] = [
  // ==========================================
  // สถานะ: รอโอนเงิน (pending_disbursement) - เคสที่ 1
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
      bankName: "ธนาคารไทยพาณิชย์ (SCB)",
      accountNumber: "123-4-56789-0",
      accountName: "นางสาวสมหญิง รักเรียน"
    },
    paymentBehavior: {
      totalLoanRequests: 2,
      onTimeInstallments: 6,
      lateInstallments: 0,
    },
    approvals: [
      {
        step: "advisor",
        actorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
        comment: "นักศึกษามีความจำเป็นต้องใช้เงินเพื่อทำวิจัยจบการศึกษา อนุมัติเบื้องต้น",
        decision: "approved",
        date: "2 ก.ย. 2569",
      },
      {
        step: "admin",
        actorName: "เจ้าหน้าที่ สมศรี",
        comment: "ตรวจสอบเอกสารครบถ้วน ประวัติการชำระเงินกองทุนรอบที่แล้วไม่มีหนี้ค้างชำระ",
        decision: "approved",
        date: "3 ก.ย. 2569",
      },
      {
        step: "executive",
        actorName: "รศ.ดร. ประเสริฐ กิตติคุณ",
        comment: "อนุมัติวงเงิน 5,000 บาท ตามที่เสนอ",
        decision: "approved",
        date: "4 ก.ย. 2569",
      }
    ],
    history: [
      { action: "ยื่นคำร้อง", date: "1 ก.ย. 2569 09:00", actor: "สมหญิง รักเรียน" },
      { action: "อนุมัติโดยอาจารย์ที่ปรึกษา", date: "2 ก.ย. 2569 10:30", actor: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ" },
      { action: "เจ้าหน้าที่ตรวจสอบผ่าน", date: "3 ก.ย. 2569 14:00", actor: "เจ้าหน้าที่ สมศรี" },
      { action: "ผู้บริหารอนุมัติวงเงิน", date: "4 ก.ย. 2569 11:15", actor: "รศ.ดร. ประเสริฐ กิตติคุณ" }
    ],
    paymentHistory: [] // ยังไม่มีการชำระคืนเพราะเพิ่งรอโอนเงิน
  },

  // ==========================================
  // สถานะ: รอโอนเงิน (pending_disbursement) - เคสที่ 2
  // ==========================================
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
      bankName: "ธนาคารกสิกรไทย (KBank)",
      accountNumber: "098-7-65432-1",
      accountName: "นายมานะ อดทน"
    },
    paymentBehavior: {
      totalLoanRequests: 0,
      onTimeInstallments: 0,
      lateInstallments: 0,
    },
    approvals: [
      {
        step: "advisor",
        actorName: "อ.ดร. สมชาย ใจดี",
        comment: "นักศึกษามีปัญหาด้านการเงินฉุกเฉิน สมควรให้ความช่วยเหลือโดยด่วน",
        decision: "approved",
        date: "29 ส.ค. 2569",
      },
      {
        step: "admin",
        actorName: "เจ้าหน้าที่ สมศรี",
        comment: "เอกสารครบถ้วน เป็นการกู้ยืมครั้งแรก",
        decision: "approved",
        date: "30 ส.ค. 2569",
      },
      {
        step: "executive",
        actorName: "รศ.ดร. ประเสริฐ กิตติคุณ",
        comment: "อนุมัติตามระเบียบกองทุนฉุกเฉิน",
        decision: "approved",
        date: "31 ส.ค. 2569",
      }
    ],
    history: [
      { action: "ยื่นคำร้อง", date: "28 ส.ค. 2569 13:45", actor: "มานะ อดทน" },
      { action: "อนุมัติโดยอาจารย์ที่ปรึกษา", date: "29 ส.ค. 2569 09:30", actor: "อ.ดร. สมชาย ใจดี" },
      { action: "เจ้าหน้าที่ตรวจสอบผ่าน", date: "30 ส.ค. 2569 10:00", actor: "เจ้าหน้าที่ สมศรี" },
      { action: "ผู้บริหารอนุมัติวงเงิน", date: "31 ส.ค. 2569 15:20", actor: "รศ.ดร. ประเสริฐ กิตติคุณ" }
    ],
    paymentHistory: []
  },

  // ==========================================
  // สถานะ: โอนเงินแล้ว (disbursed) - เคสที่มีรูปสลิปแล้ว
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
      bankName: "ธนาคารกรุงไทย (KTB)",
      accountNumber: "111-2-33344-5",
      accountName: "นางสาวใจดี เรียนเก่ง"
    },
    // 👇 แนบ URL สลิปจำลอง เพื่อให้ปุ่ม "ดูหลักฐาน" ทำงานและแสดงรูปสลิป
    slipUrl: "https://placehold.co/400x600/e2e8f0/64748b?text=Disbursement+Slip+Proof",
    paymentBehavior: {
      totalLoanRequests: 3,
      onTimeInstallments: 11,
      lateInstallments: 1, // ทดสอบให้มีชำระล่าช้า 1 ครั้ง
    },
    approvals: [
      {
        step: "advisor",
        actorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
        comment: "เป็นนักศึกษาเรียนดีแต่ขาดแคลนทุนทรัพย์ เห็นควรพิจารณาอนุมัติวงเงินเต็มจำนวน",
        decision: "approved",
        date: "16 ส.ค. 2569",
      },
      {
        step: "admin",
        actorName: "เจ้าหน้าที่ สมศรี",
        comment: "เอกสารใบแจ้งหนี้ถูกต้อง ประวัติเก่าเคยช้า 1 งวด แต่เคลียร์ยอดครบแล้ว",
        decision: "approved",
        date: "17 ส.ค. 2569",
      },
      {
        step: "executive",
        actorName: "รศ.ดร. ประเสริฐ กิตติคุณ",
        comment: "อนุมัติวงเงิน 10,000 บาท",
        decision: "approved",
        date: "18 ส.ค. 2569",
      }
    ],
    history: [
      { action: "ยื่นคำร้อง", date: "15 ส.ค. 2569 08:30", actor: "ใจดี เรียนเก่ง" },
      { action: "อนุมัติโดยอาจารย์ที่ปรึกษา", date: "16 ส.ค. 2569 11:00", actor: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ" },
      { action: "เจ้าหน้าที่ตรวจสอบผ่าน", date: "17 ส.ค. 2569 14:20", actor: "เจ้าหน้าที่ สมศรี" },
      { action: "ผู้บริหารอนุมัติวงเงิน", date: "18 ส.ค. 2569 10:15", actor: "รศ.ดร. ประเสริฐ กิตติคุณ" },
      { action: "โอนเงินสำเร็จ", date: "19 ส.ค. 2569 13:45", actor: "ผู้ดูแลระบบ (Admin)" }
    ],
    // ข้อมูลจำลองการผ่อนชำระ (นักศึกษาชำระคืนกองทุน)
    paymentHistory: [
      {
        installmentNumber: 1,
        amount: "1666.67",
        status: "verified",
      },
      {
        installmentNumber: 2,
        amount: "1666.67",
        status: "verified", // จ่ายงวด 2 แล้ว สถานะตารางผ่อนจะขึ้นติ๊กถูกสีเขียว
      }
    ]
  }
];