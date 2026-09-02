import { ActionRequest } from "./pending/RequestsCard";

export const mockAdvisorRequests: ActionRequest[] = [
  {
    id: "REQ-2024-0015",
    name: "ธนาธร เรียนดี",
    studentId: "65050123",
    major: "วิทยาการคอมพิวเตอร์",
    year: "2",
    phone: "081-111-2222",
    objective: "ยืมเพื่อซื้อคอมพิวเตอร์โน้ตบุ๊กสำหรับทำโปรเจกต์จบและเขียนโปรแกรม",
    amount: "15000",
    term: "6",
    expectedReturnDate: "มิ.ย. 2568",
    requestStatus: "pending_advisor",
    submitDate: "15 ต.ค. 2567",
    waitDays: 2,
    isOverdue: false,
    bankDetails: {
      bankName: "ธนาคารกรุงไทย",
      accountNumber: "111-2-33333-4",
      accountName: "นาย ธนาธร เรียนดี",
    },
    paymentBehavior: { totalLoanRequests: 0, onTimeInstallments: 0, lateInstallments: 0 },
    approvals: [], // ยังไม่มีความเห็น
    history: [
      { action: "นักศึกษายื่นคำร้อง", date: "15 ต.ค. 2567 09:30", actor: "ธนาธร เรียนดี" }
    ],
  },
  {
    id: "REQ-2024-0016",
    name: "สมหญิง ขยันอ่าน",
    studentId: "64010999",
    major: "พยาบาลศาสตร์",
    year: "3",
    phone: "082-333-4444",
    objective: "เป็นค่าหอพักเนื่องจากทางบ้านหมุนเงินไม่ทัน",
    amount: "4500",
    term: "3",
    expectedReturnDate: "ม.ค. 2568",
    requestStatus: "pending_admin",
    submitDate: "14 ต.ค. 2567",
    waitDays: 3,
    isOverdue: false,
    bankDetails: {
      bankName: "ธนาคารกสิกรไทย",
      accountNumber: "222-3-44444-5",
      accountName: "นางสาว สมหญิง ขยันอ่าน",
    },
    paymentBehavior: { totalLoanRequests: 1, onTimeInstallments: 6, lateInstallments: 0 },
    approvals: [
      {
        step: "advisor",
        actorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
        comment: "นักศึกษามีความประพฤติดี เห็นควรให้กู้ยืม",
        decision: "approved",
        date: "15 ต.ค. 2567"
      }
    ],
    history: [
      { action: "นักศึกษายื่นคำร้อง", date: "14 ต.ค. 2567 10:00", actor: "สมหญิง ขยันอ่าน" },
      { action: "อ.ที่ปรึกษา อนุมัติ", date: "15 ต.ค. 2567 08:30", actor: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ" }
    ],
  },
  {
    id: "REQ-2024-0017",
    name: "กิตติพงษ์ หลงทาง",
    studentId: "66010555",
    major: "พยาบาลศาสตร์",
    year: "1",
    phone: "082-222-3333",
    objective: "ยืมเงินเพื่อไปซื้อโทรศัพท์มือถือรุ่นใหม่",
    amount: "25000",
    term: "12",
    expectedReturnDate: "ธ.ค. 2568",
    requestStatus: "rejected",
    submitDate: "11 ต.ค. 2567",
    waitDays: 0,
    isOverdue: false,
    bankDetails: {
      bankName: "ธนาคารไทยพาณิชย์",
      accountNumber: "555-6-77777-8",
      accountName: "นาย กิตติพงษ์ หลงทาง",
    },
    paymentBehavior: { totalLoanRequests: 1, onTimeInstallments: 2, lateInstallments: 3 },
    approvals: [
      {
        step: "advisor",
        actorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
        comment: "วัตถุประสงค์ไม่สอดคล้องกับระเบียบการให้กู้ยืมฉุกเฉิน",
        decision: "rejected",
        date: "12 ต.ค. 2567"
      }
    ],
    history: [
      { action: "นักศึกษายื่นคำร้อง", date: "11 ต.ค. 2567 13:45", actor: "กิตติพงษ์ หลงทาง" },
      { action: "อ.ที่ปรึกษา ไม่อนุมัติ", date: "12 ต.ค. 2567 09:10", actor: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ" }
    ],
  }
];