import { ActionRequest } from "@/components/shared/pending/RequestsCard";

export const mockAdvisorRequests: ActionRequest[] = [
  // 1. รายการที่รออาจารย์ที่ปรึกษาพิจารณา (จะแสดงในแท็บ "รอพิจารณา")
  {
    id: "REQ-67001",
    name: "นางสาวสมหญิง รักเรียน",
    studentId: "651234567",
    major: "พยาบาลศาสตร์",
    program: "พยาบาลศาสตรบัณฑิต",
    year: "3",
    phone: "081-111-1111",
    objective: "เพื่อนำไปจ่ายค่าเช่าหอพักและค่าครองชีพประจำเดือน เนื่องจากทางบ้านส่งเงินให้ล่าช้า",
    amount: "5000",
    term: "5",
    submitDate: "15 ต.ค. 2567",
    requestStatus: "pending_advisor",
    history: [
      {
        action: "ยื่นคำร้องขอกู้ยืม",
        date: "15 ต.ค. 2567 09:30",
        actor: "นางสาวสมหญิง รักเรียน",
      },
    ],
    paymentBehavior: {
      totalLoanRequests: 1,
      onTimeInstallments: 5,
      lateInstallments: 0,
    },
    bankDetails: {
      bankName: "ธนาคารไทยพาณิชย์",
      accountNumber: "123-4-56789-0",
      accountName: "นางสาวสมหญิง รักเรียน",
    },
  },
  {
    id: "REQ-67002",
    name: "นายสมชาย ใจสู้",
    studentId: "661234568",
    major: "พยาบาลศาสตร์",
    program: "พยาบาลศาสตรบัณฑิต",
    year: "2",
    phone: "082-222-2222",
    objective: "ใช้จ่ายเป็นค่าอุปกรณ์การเรียนและค่ารักษาพยาบาลฉุกเฉิน",
    amount: "3000",
    term: "3",
    submitDate: "16 ต.ค. 2567",
    requestStatus: "pending_advisor",
    history: [
      {
        action: "ยื่นคำร้องขอกู้ยืม",
        date: "16 ต.ค. 2567 14:15",
        actor: "นายสมชาย ใจสู้",
      },
    ],
    paymentBehavior: {
      totalLoanRequests: 0,
      onTimeInstallments: 0,
      lateInstallments: 0,
    },
    bankDetails: {
      bankName: "ธนาคารกสิกรไทย",
      accountNumber: "098-7-65432-1",
      accountName: "นายสมชาย ใจสู้",
    },
  },

  // 2. รายการที่ผ่านอาจารย์ไปแล้ว รอเจ้าหน้าที่ (จะแสดงในแท็บ "อนุมัติแล้ว" หรือ "รอเจ้าหน้าที่")
  {
    id: "REQ-67003",
    name: "นางสาววิลาสินี ดีงาม",
    studentId: "641234569",
    major: "พยาบาลศาสตร์",
    program: "พยาบาลศาสตรบัณฑิต",
    year: "4",
    phone: "083-333-3333",
    objective: "ค่าใช้จ่ายในการทำวิจัยและปริญญานิพนธ์",
    amount: "4500",
    term: "4",
    submitDate: "10 ต.ค. 2567",
    requestStatus: "pending_admin", // ผ่าน advisor แล้ว
    history: [
      {
        action: "ยื่นคำร้องขอกู้ยืม",
        date: "10 ต.ค. 2567 10:00",
        actor: "นางสาววิลาสินี ดีงาม",
      },
      {
        action: "อาจารย์ที่ปรึกษาพิจารณาเห็นชอบ",
        date: "11 ต.ค. 2567 09:00",
        actor: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
      },
    ],
    approvals: [
      {
        step: "advisor",
        actorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
        comment: "นักศึกษามีความจำเป็นจริงและประพฤติตัวดี เห็นสมควรให้กู้ยืม",
        decision: "approved",
        date: "11 ต.ค. 2567",
      },
    ],
    paymentBehavior: {
      totalLoanRequests: 2,
      onTimeInstallments: 8,
      lateInstallments: 0,
    },
  },

  // 3. รายการที่ถูกส่งกลับให้แก้ไข (จะแสดงในแท็บ "ไม่อนุมัติ/ส่งกลับ")
  {
    id: "REQ-67004",
    name: "นายณัฐวุฒิ เรียนดี",
    studentId: "671234570",
    major: "พยาบาลศาสตร์",
    program: "พยาบาลศาสตรบัณฑิต",
    year: "1",
    phone: "084-444-4444",
    objective: "ซื้อไอแพดสำหรับใช้เรียน",
    amount: "15000",
    term: "10",
    submitDate: "12 ต.ค. 2567",
    requestStatus: "returned",
    history: [
      {
        action: "ยื่นคำร้องขอกู้ยืม",
        date: "12 ต.ค. 2567 11:20",
        actor: "นายณัฐวุฒิ เรียนดี",
      },
      {
        action: "ส่งกลับให้นักศึกษาแก้ไข",
        date: "13 ต.ค. 2567 15:30",
        actor: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
      },
    ],
    approvals: [
      {
        step: "advisor",
        actorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
        comment: "วงเงินสูงเกินไป และวัตถุประสงค์ยังไม่สอดคล้องกับเกณฑ์กองทุนฉุกเฉิน ขอให้ปรับลดวงเงินหรือชี้แจงความจำเป็นเพิ่มเติม",
        decision: "returned",
        date: "13 ต.ค. 2567",
      },
    ],
  },
  
  // 4. รายการที่รอผู้บริหารพิจารณาขั้นสุดท้าย (จะแสดงในแท็บ "อนุมัติแล้ว" หากดูในมุม Advisor)
  {
    id: "REQ-67005",
    name: "นางสาวอรทัย ใจบุญ",
    studentId: "651234571",
    major: "พยาบาลศาสตร์",
    program: "พยาบาลศาสตรบัณฑิต",
    year: "3",
    phone: "085-555-5555",
    objective: "ค่าใช้จ่ายส่วนตัวระหว่างฝึกงาน",
    amount: "4000",
    term: "4",
    submitDate: "08 ต.ค. 2567",
    requestStatus: "pending_executive",
    history: [
      {
        action: "ยื่นคำร้องขอกู้ยืม",
        date: "08 ต.ค. 2567 08:30",
        actor: "นางสาวอรทัย ใจบุญ",
      },
      {
        action: "อาจารย์ที่ปรึกษาพิจารณาเห็นชอบ",
        date: "09 ต.ค. 2567 10:15",
        actor: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
      },
      {
        action: "เจ้าหน้าที่ตรวจสอบเอกสารครบถ้วน",
        date: "10 ต.ค. 2567 14:00",
        actor: "นางจินตนา เจ้าหน้าที่คณะ",
      },
    ],
    approvals: [
      {
        step: "advisor",
        actorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
        comment: "เห็นควรอนุมัติ",
        decision: "approved",
        date: "09 ต.ค. 2567",
      },
      {
        step: "admin",
        actorName: "นางจินตนา เจ้าหน้าที่คณะ",
        comment: "เอกสารครบถ้วน ถูกต้อง",
        decision: "approved",
        date: "10 ต.ค. 2567",
      },
    ],
    paymentBehavior: {
      totalLoanRequests: 1,
      onTimeInstallments: 3,
      lateInstallments: 1,
    },
  }
];