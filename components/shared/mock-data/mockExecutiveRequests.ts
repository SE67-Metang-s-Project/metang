import { ActionRequest } from "../pending/RequestsCard";

export const mockExecutiveRequests: ActionRequest[] = [
  {
    id: "REQ-67010",
    name: "นายภูริทัต ตั้งใจเรียน",
    studentId: "641234580",
    major: "พยาบาลศาสตร์",
    program: "พยาบาลศาสตรบัณฑิต",
    year: "4",
    phone: "089-999-9999",
    objective: "เป็นค่าใช้จ่ายในการทำปริญญานิพนธ์และค่าครองชีพฉุกเฉิน",
    amount: "8000",
    term: "8",
    submitDate: "12 ต.ค. 2567",
    requestStatus: "pending_executive", // <--- สถานะรอผู้บริหาร
    history: [
      {
        action: "ยื่นคำร้องขอกู้ยืม",
        date: "12 ต.ค. 2567 09:00",
        actor: "นายภูริทัต ตั้งใจเรียน",
      },
      {
        action: "อาจารย์ที่ปรึกษาพิจารณาเห็นชอบ",
        date: "13 ต.ค. 2567 10:30",
        actor: "อ.ดร. ใจดี มีเมตตา",
      },
      {
        action: "เจ้าหน้าที่ตรวจสอบเอกสารครบถ้วน",
        date: "14 ต.ค. 2567 14:00",
        actor: "นางสมศรี รักงาน",
      },
    ],
    approvals: [
      {
        step: "advisor",
        actorName: "อ.ดร. ใจดี มีเมตตา",
        comment: "นักศึกษามีความจำเป็นเร่งด่วนและมีความประพฤติดี",
        decision: "approved",
        date: "13 ต.ค. 2567",
      },
      {
        step: "admin",
        actorName: "นางสมศรี รักงาน",
        comment: "เอกสารครบถ้วน ตรวจสอบประวัติการชำระเงินปกติ",
        decision: "approved",
        date: "14 ต.ค. 2567",
      },
    ],
    paymentBehavior: {
      totalLoanRequests: 3,
      onTimeInstallments: 12,
      lateInstallments: 0,
    },
    bankDetails: {
      bankName: "ธนาคารกรุงไทย",
      accountNumber: "111-2-33333-4",
      accountName: "นายภูริทัต ตั้งใจเรียน",
    },
  },
  {
    id: "REQ-67011",
    name: "นางสาวศิริพร พรประเสริฐ",
    studentId: "661234581",
    major: "พยาบาลศาสตร์",
    program: "พยาบาลศาสตรบัณฑิต",
    year: "2",
    phone: "088-888-8888",
    objective: "ชำระค่าหอพักเนื่องจากผู้ปกครองประสบอุบัติเหตุทำให้ส่งเงินล่าช้า",
    amount: "5000",
    term: "5",
    submitDate: "14 ต.ค. 2567",
    requestStatus: "pending_executive",
    history: [
      {
        action: "ยื่นคำร้องขอกู้ยืม",
        date: "14 ต.ค. 2567 11:20",
        actor: "นางสาวศิริพร พรประเสริฐ",
      },
      {
        action: "อาจารย์ที่ปรึกษาพิจารณาเห็นชอบ",
        date: "15 ต.ค. 2567 09:15",
        actor: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
      },
      {
        action: "เจ้าหน้าที่ตรวจสอบเอกสารครบถ้วน",
        date: "15 ต.ค. 2567 15:45",
        actor: "นางสมศรี รักงาน",
      },
    ],
    approvals: [
      {
        step: "advisor",
        actorName: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ",
        comment: "เห็นสมควรให้กู้ยืมเพื่อบรรเทาความเดือดร้อน",
        decision: "approved",
        date: "15 ต.ค. 2567",
      },
      {
        step: "admin",
        actorName: "นางสมศรี รักงาน",
        comment: "ตรวจสอบหลักฐานใบรับรองแพทย์ของผู้ปกครองแล้ว ครบถ้วน",
        decision: "approved",
        date: "15 ต.ค. 2567",
      },
    ],
    paymentBehavior: {
      totalLoanRequests: 0,
      onTimeInstallments: 0,
      lateInstallments: 0,
    },
    bankDetails: {
      bankName: "ธนาคารกสิกรไทย",
      accountNumber: "222-3-44444-5",
      accountName: "นางสาวศิริพร พรประเสริฐ",
    },
  },
];