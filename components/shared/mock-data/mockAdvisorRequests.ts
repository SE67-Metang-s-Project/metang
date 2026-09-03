import { ActionRequest } from "@/components/shared/pending/RequestsCard";

export const mockAdvisorRequests: ActionRequest[] = [
  {
    id: "REQ-2024-0015",
    name: "วิภาวี พยาบาล",
    // 66 (ปีเข้า) + 12 (คณะพยาบาล) + 1 (ป.ตรี) + 0045 (ลำดับที่)
    studentId: "661210045", 
    major: "พยาบาลศาสตร์ (ป.ตรี)",
    year: "2",
    phone: "081-111-2222",
    objective: "ยืมเพื่อจ่ายค่าหอพักฉุกเฉิน",
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
      accountName: "นางสาว วิภาวี พยาบาล",
    },
    paymentBehavior: { totalLoanRequests: 0, onTimeInstallments: 0, lateInstallments: 0 },
    approvals: [], 
    history: [
      { action: "นักศึกษายื่นคำร้อง", date: "15 ต.ค. 2567 09:30", actor: "วิภาวี พยาบาล" }
    ],
  },
  {
    id: "REQ-2024-0016",
    name: "สมหญิง ขยันอ่าน",
    // 67 (ปีเข้า) + 12 (คณะพยาบาล) + 0 (ผู้ช่วยพยาบาล) + 0122 (ลำดับที่)
    studentId: "671200122",
    major: "ประกาศนียบัตรผู้ช่วยพยาบาล",
    year: "1",
    phone: "082-333-4444",
    objective: "ซื้ออุปกรณ์ตรวจวัดความดัน",
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
        comment: "นักศึกษามีความจำเป็นเร่งด่วน อนุมัติ",
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
    // 65 (ปีเข้า) + 12 (คณะพยาบาล) + 3 (ป.โท) + 0005 (ลำดับที่)
    studentId: "651230005",
    major: "พยาบาลศาสตร์ (ป.โท)",
    year: "3",
    phone: "082-222-3333",
    objective: "ยืมเงินเพื่อไปทำวิจัย",
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
    paymentBehavior: { totalLoanRequests: 2, onTimeInstallments: 2, lateInstallments: 3 }, // ตั้งใจให้ late เพื่อทดสอบ tab "เคยชำระล่าช้า"
    approvals: [
      {
        step: "advisor",
        actorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
        comment: "วัตถุประสงค์ไม่ตรงตามระเบียบ",
        decision: "rejected",
        date: "12 ต.ค. 2567"
      }
    ],
    history: [
      { action: "นักศึกษายื่นคำร้อง", date: "11 ต.ค. 2567 13:45", actor: "กิตติพงษ์ หลงทาง" },
      { action: "อ.ที่ปรึกษา ไม่อนุมัติ", date: "12 ต.ค. 2567 09:10", actor: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ" }
    ],
  },
  {
    id: "REQ-2024-0018",
    name: "อาจารย์ สมรักษ์",
    // 64 (ปีเข้า) + 12 (คณะพยาบาล) + 5 (ป.เอก) + 0001 (ลำดับที่)
    studentId: "641250001",
    major: "พยาบาลศาสตร์ (ป.เอก)",
    year: "4",
    phone: "089-999-8888",
    objective: "ค่าใช้จ่ายในการตีพิมพ์ผลงานวิชาการ",
    amount: "30000",
    term: "6",
    expectedReturnDate: "พ.ค. 2568",
    requestStatus: "disbursed", // ให้โชว์ว่ามียอดคงเหลือเพื่อทดสอบ tab "มีหนี้คงเหลือ"
    submitDate: "01 ต.ค. 2567",
    waitDays: 0,
    isOverdue: true,
    bankDetails: {
      bankName: "ธนาคารกรุงเทพ",
      accountNumber: "888-9-99999-0",
      accountName: "นาย สมรักษ์ สมชื่อ",
    },
    paymentBehavior: { totalLoanRequests: 3, onTimeInstallments: 12, lateInstallments: 0 },
    approvals: [
      {
        step: "advisor",
        actorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
        comment: "เห็นสมควร",
        decision: "approved",
        date: "02 ต.ค. 2567"
      }
    ],
    history: [
      { action: "นักศึกษายื่นคำร้อง", date: "01 ต.ค. 2567 09:00", actor: "สมรักษ์ สมชื่อ" },
      { action: "โอนเงินเรียบร้อย", date: "05 ต.ค. 2567 10:00", actor: "ระบบ" }
    ],
  }
];