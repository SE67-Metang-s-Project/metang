import type { LoanRequestHistoryItem } from "@/app/student/studentMockData";

export const tempCurrentLoanDetails = {
  requestNumber: "SL-2568-0001",
  statusLabel: "รอยืนยันการรับเงิน",
  submittedAt: "ยื่นเมื่อ 18 ธ.ค. 2569 10:00 น.",
  purposeLabel: "วัตถุประสงค์การกู้ยืม",
  purpose: "ค่าเทอมภาคเรียนที่ 1/2569",
  amount: "3,000",
  downloadLabel: "",
  additionalReasonLabel: "หมายเหตุเพิ่มเติม",
  additionalReason:
    "ข้าพเจ้ามีความจำเป็นต้องกู้ยืมเพื่อชำระค่าเทอม เนื่องจากครอบครัวขาดสภาพคล่องทางการเงิน เพื่อให้สามารถศึกษาต่อได้อย่างต่อเนื่อง",
};

export const tempStudentProfile = {
  displayName: "นางสาวกมลชนก",
  programName: "พยาบาลศาสตรบัณฑิต",
  yearLabel: "ชั้นปีที่ 3",
  studentId: "661215001",
  initials: "MT",
};

export const tempLoanApplication = {
  actionLabel: "ยื่นคำร้องกู้ยืม",
};

export const tempLoanFormOptions = {
  educationLevels: [
    "ประกาศนียบัตรผู้ช่วยพยาบาล",
    "ปริญญาตรี",
    "ปริญญาโท",
    "ปริญญาเอก",
  ].map((educationLevel) => ({ label: educationLevel, value: educationLevel })),
  academicYears: ["1", "2", "3", "4"].map((year) => ({ label: year, value: year })),
  advisors: ["พิมพา มีโชค", "วรัญญู มีโชค"].map((advisor) => ({
    label: advisor,
    value: advisor,
  })),
  banks: ["ธนาคารกสิกรไทย", "ธนาคารกรุงไทย"].map((bank) => ({
    label: bank,
    value: bank,
  })),
};

export const tempLoanAgreement = {
  title: "ข้อกำหนดและเงื่อนไขการกู้ยืมเงินเพื่อการศึกษา",
  organization: "คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่",
  introduction:
    "เอกสารฉบับนี้จัดทำขึ้นเพื่อกำหนดหลักเกณฑ์ ข้อตกลง และเงื่อนไขสำหรับการกู้ยืมเงินเพื่อการศึกษา ประจำภาคเรียนที่ 1 ปีการศึกษา 2569 ของคณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่ โดยนักศึกษาผู้ขอกู้ยืมต้องทำความเข้าใจและปฏิบัติตามเงื่อนไขดังต่อไปนี้",
  sections: [
    {
      title: "1. วัตถุประสงค์การกู้ยืม",
      body: "เงินกู้ยืมที่ได้รับการอนุมัติจะต้องนำไปใช้เพื่อชำระค่าธรรมเนียมการศึกษา (ค่าเทอม) ประจำภาคเรียนที่ 1/2569 ของคณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่ เท่านั้น เพื่อช่วยเหลือและบรรเทาความเดือดร้อนจากภาวะขาดสภาพคล่องทางการเงินของครอบครัว ให้สามารถศึกษาต่อได้อย่างต่อเนื่อง",
    },
    {
      title: "2. หน้าที่และความรับผิดชอบ",
      body: "ผู้กู้ยืมจะต้องตั้งใจศึกษาเล่าเรียน ประพฤติตนตามจรรยาบรรณวิชาชีพ และปฏิบัติตามกฎระเบียบของคณะพยาบาลศาสตร์และมหาวิทยาลัยเชียงใหม่อย่างเคร่งครัดตลอดระยะเวลาที่ยังคงสถานภาพความเป็นนักศึกษา",
    },
    {
      title: "3. เงื่อนไขการชำระคืน",
      body: "ผู้กู้ยืมรับทราบและยินยอมที่จะชำระเงินกู้ยืมคืนเต็มจำนวน พร้อมทั้งปฏิบัติตามเงื่อนไข วิธีการ และระยะเวลาที่คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่ หรือกองทุนผู้ให้กู้ยืมได้กำหนดไว้ทุกประการ",
    },
    {
      title: "4. บทลงโทษและการผิดนัดชำระหนี้",
      body: "หากผู้กู้ยืมนำเงินไปใช้ผิดวัตถุประสงค์ ผิดนัดชำระหนี้ หรือไม่ปฏิบัติตามเงื่อนไขข้อใดข้อหนึ่ง ผู้กู้ยืมยินยอมให้คณะพยาบาลศาสตร์และมหาวิทยาลัยเชียงใหม่ระงับการให้ความช่วยเหลือ และดำเนินการตามระเบียบ ขั้นตอน หรือกฎหมายที่เกี่ยวข้องต่อไป",
    },
  ],
  acceptanceLabel:
    "ข้าพเจ้ารับทราบและยินยอมปฏิบัติตามหลักเกณฑ์ ข้อตกลง และเงื่อนไขการกู้ยืมเงินตามที่คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่กำหนด",
};

export type TempLoanFormData = {
  educationLevel: string;
  academicYear: string;
  advisorName: string;
  phoneNumber: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  purpose: string;
  additionalNote: string;
  loanAmount: string;
  installmentCount: number;
};

export const tempLoanFormDefaults: TempLoanFormData = {
  educationLevel: "",
  academicYear: "",
  advisorName: "",
  phoneNumber: "",
  bankName: "",
  accountNumber: "",
  accountName: "",
  purpose: "",
  additionalNote: "-",
  loanAmount: "",
  installmentCount: 3,
};

export const tempRepaymentSchedule = [
  {
    installmentNumber: 1,
    dueDateLabel: "ครบกำหนด 7 ก.ค. 2569",
    amount: "1,000",
  },
  {
    installmentNumber: 2,
    dueDateLabel: "ครบกำหนด 9 ส.ค. 2569",
    amount: "1,000",
  },
  {
    installmentNumber: 3,
    dueDateLabel: "ครบกำหนด 8 ก.ย. 2569",
    amount: "1,000",
  },
];

export const tempLoanTimeline = [
  {
    title: "ส่งคำร้องกู้ยืม",
    dateTime: "18 ธ.ค. 2569 10:00 น.",
    actor: "กมลชนก มีโชค",
  },
  {
    title: "อาจารย์ที่ปรึกษาอนุมัติ",
    dateTime: "18 ธ.ค. 2569 10:00 น.",
    actor: "พิมพา มีโชค",
  },
  {
    title: "เจ้าหน้าที่ตรวจสอบเอกสาร",
    dateTime: "18 ธ.ค. 2569 10:00 น.",
    actor: "วรัญญู มีโชค",
  },
  {
    title: "ผู้บริหารพิจารณาอนุมัติ",
    dateTime: "18 ธ.ค. 2569 10:00 น.",
    actor: "เอกฤทธิ์ มีโชค",
  },
  {
    title: "เจ้าหน้าที่โอนเงิน จำนวน 3,000",
    dateTime: "8 ธ.ค. 2569 10:00 น.",
    actor: "วรัญญู มีโชค",
    transferDetails: [
      "ธนาคาร: ธนาคารกสิกรไทย",
      "เลขที่บัญชี: 12345679000",
      "ชื่อบัญชี: กมลชนก มีโชค",
    ],
  },
];

export const tempPaymentBehavior = {
  lateStatusLabel: "ชำระล่าช้า",
  lateInstallments: 3,
  onTimeStatusLabel: "ชำระตรงเวลา",
  onTimeInstallments: 9,
  totalLoanRequests: 4,
  totalInstallments: 12,
};

export const tempLoanRequestHistory: LoanRequestHistoryItem[] = [
  {
    requestNumber: "SL-2568-0001",
    statusLabel: "รอยืนยันการรับเงิน",
    statusType: "waitingPaymentConfirmation",
    submittedAt: "ยื่นเมื่อ 18 ธ.ค. 2569 10:00 น.",
    purpose: "ค่าเทอมภาคเรียนที่ 1/2569",
    amountLabel: "จำนวนที่ขอกู้",
    amount: "3,000",
  },
  {
    requestNumber: "SL-2568-0001",
    statusLabel: "ปฏิเสธโดย · อาจารย์ที่ปรึกษา",
    statusType: "rejectedExecutive",
    submittedAt: "ยื่นเมื่อ 18 ธ.ค. 2569 10:00 น.",
    purpose: "ค่าเทอมภาคเรียนที่ 1/2569",
    amountLabel: "จำนวนที่ขอกู้",
    amount: "3,000",
  },
  {
    requestNumber: "SL-2568-0002",
    statusLabel: "รออาจารย์ที่ปรึกษาอนุมัติ",
    statusType: "waitingAdvisorApproval",
    submittedAt: "ยื่นเมื่อ 20 ม.ค. 2570 09:30 น.",
    purpose: "ค่าใช้จ่ายระหว่างการศึกษา",
    amountLabel: "จำนวนที่ขอกู้",
    amount: "5,000",
  },
];
