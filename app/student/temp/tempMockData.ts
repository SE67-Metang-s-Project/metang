import type { LoanRequestHistoryItem } from "@/app/student/studentMockData";

export const tempCurrentLoanDetails = {
  requestNumber: "SL-2568-0001",
  statusLabel: "รอยืนยันการรับเงิน",
  submittedAt: "ยื่นเมื่อ 18 ธ.ค. 2569 10:00 น.",
  purposeLabel: "วัตถุประสงค์การกู้ยืม",
  purpose: "ค่าเทอมภาคเรียนที่ 1/2569",
  amount: "3,000",
  downloadLabel: "ดาวน์โหลดเอกสาร",
  additionalReasonLabel: "หมายเหตุเพิ่มเติม",
  additionalReason:
    "ข้าพเจ้ามีความจำเป็นต้องกู้ยืมเพื่อชำระค่าเทอม เนื่องจากครอบครัวขาดสภาพคล่องทางการเงิน เพื่อให้สามารถศึกษาต่อได้อย่างต่อเนื่อง",
};

export const tempStudentProfile = {
  displayName: "นางสาวกมลชนก มีโชค",
  programName: "พยาบาลศาสตรบัณฑิต",
  educationLevel: "ปริญญาตรี",
  yearLabel: "ชั้นปีที่ 3",
  studentId: "670550702",
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
  banks: [
    ["KBANK", "ธนาคารกสิกรไทย", "Kasikornbank"],
    ["SCB", "ธนาคารไทยพาณิชย์", "Siam Commercial Bank"],
    ["KTB", "ธนาคารกรุงไทย", "Krungthai Bank"],
    ["BBL", "ธนาคารกรุงเทพ", "Bangkok Bank"],
    ["BAY", "ธนาคารกรุงศรีอยุธยา", "Krungsri Bank"],
    ["TTB", "ธนาคารทหารไทยธนชาต", "TMBThanachart Bank"],
    ["GSB", "ธนาคารออมสิน", "Government Savings Bank"],
    ["BAAC", "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)", "BAAC"],
    ["GHB", "ธนาคารอาคารสงเคราะห์ (ธอส.)", "Government Housing Bank"],
    ["UOB", "ธนาคารยูโอบี", "United Overseas Bank"],
    ["KKP", "ธนาคารเกียรตินาคินภัทร", "Kiatnakin Phatra Bank"],
    ["CIMB", "ธนาคารซีไอเอ็มบี ไทย", "CIMB Thai Bank"],
    ["TISCO", "ธนาคารทิสโก้", "TISCO Bank"],
  ].map(([code, label, labelEn]) => ({
    label,
    labelEn,
    logoSrc: `/bank-logos/${code}.png`,
    value: label,
  })),
};

export const tempLoanAgreement = {
  title: "ข้อกำหนดและเงื่อนไขการกู้ยืมเงิน",
  organization: "คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่",
  introduction:
    "เอกสารฉบับนี้จัดทำขึ้นเพื่อกำหนดหลักเกณฑ์ ข้อตกลง และเงื่อนไขสำหรับการกู้ยืมเงินของคณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่ (ต่อไปในเอกสารนี้เรียกว่า \"คณะฯ\") โดยนักศึกษาผู้ยื่นคำร้องขอกู้ยืม (ต่อไปในเอกสารนี้เรียกว่า \"ผู้กู้ยืม\") จะต้องอ่าน ทำความเข้าใจ และให้ความยินยอมต่อข้อกำหนดและเงื่อนไขทุกข้อโดยละเอียด ก่อนดำเนินการกรอกข้อมูลและยื่นคำร้องขอกู้ยืมในขั้นตอนถัดไป ทั้งนี้ ข้อกำหนดฉบับนี้จัดทำขึ้นโดยมีเจตนารมณ์เพื่อช่วยเหลือและบรรเทาความเดือดร้อนด้านการเงินของนักศึกษาเป็นสำคัญ มิได้มีลักษณะเป็นการกำหนดบทลงโทษหรือความรับผิดทางกฎหมายแต่อย่างใด",
  sections: [
    {
      title: "1. วัตถุประสงค์ของเงินกู้ยืม",
      body: "เงินกู้ยืมที่ได้รับการอนุมัติภายใต้ข้อกำหนดฉบับนี้ มีเจตนารมณ์เพื่อช่วยเหลือและบรรเทาความเดือดร้อนทางการเงินของผู้กู้ยืมตามความจำเป็นที่แท้จริง โดยผู้กู้ยืมเป็นผู้ระบุวัตถุประสงค์ของการขอกู้ยืมด้วยตนเองในคำร้อง ทั้งนี้ วัตถุประสงค์ดังกล่าวมิได้จำกัดอยู่เพียงค่าใช้จ่ายที่เกี่ยวข้องกับการศึกษาเท่านั้น แต่ให้ครอบคลุมถึงความจำเป็นอื่นใดของผู้กู้ยืมตามที่ระบุไว้ในคำร้อง",
    },
    {
      title: "2. คุณสมบัติของผู้ยื่นคำร้อง",
      body: "ผู้ยื่นคำร้องขอกู้ยืมต้องมีสถานภาพเป็นนักศึกษาที่กำลังศึกษาอยู่ในคณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่ และต้องกรอกข้อมูลส่วนบุคคล ข้อมูลติดต่อ ข้อมูลบัญชีธนาคารสำหรับรับโอนเงิน ตลอดจนข้อมูลอาจารย์ที่ปรึกษาให้ถูกต้อง ครบถ้วน และเป็นความจริงทุกประการ เพื่อประโยชน์ในการพิจารณาอนุมัติและการติดต่อประสานงานของคณะฯ ในทุกขั้นตอนของกระบวนการกู้ยืม",
    },
    {
      title: "3. ขั้นตอนการพิจารณาและการอนุมัติ",
      body: "คำร้องขอกู้ยืมที่ผู้กู้ยืมยื่นเข้าสู่ระบบจะได้รับการพิจารณากลั่นกรองตามลำดับขั้นตอน โดยเริ่มจากอาจารย์ที่ปรึกษา เจ้าหน้าที่ผู้รับผิดชอบ และผู้บริหารของคณะฯ ตามลำดับ ทั้งนี้ คณะฯ ขอสงวนสิทธิ์ในการพิจารณาอนุมัติจำนวนเงินกู้ยืมเต็มจำนวนหรือบางส่วนตามความเหมาะสม โดยคำนึงถึงความจำเป็นของผู้กู้ยืมและงบประมาณกองทุนที่มีอยู่ในขณะนั้นเป็นสำคัญ และหากคณะฯ มีความประสงค์ขอข้อมูลหรือเอกสารเพิ่มเติมเพื่อประกอบการพิจารณา ผู้กู้ยืมตกลงให้ความร่วมมือในการจัดส่งข้อมูลดังกล่าวตามระยะเวลาที่กำหนด",
    },
    {
      title: "4. การเบิกจ่ายเงินกู้ยืม",
      body: "เมื่อคำร้องขอกู้ยืมได้รับการอนุมัติครบทุกขั้นตอนแล้ว คณะฯ จะดำเนินการโอนเงินเข้าบัญชีธนาคารตามชื่อ เลขที่บัญชี และธนาคารที่ผู้กู้ยืมแจ้งไว้ในคำร้อง ผู้กู้ยืมมีหน้าที่ตรวจสอบความถูกต้องของข้อมูลบัญชีธนาคารก่อนยื่นคำร้อง หากข้อมูลบัญชีไม่ถูกต้องหรือไม่สามารถโอนเงินได้ ผู้กู้ยืมตกลงแจ้งแก้ไขข้อมูลต่อคณะฯ โดยไม่ชักช้า เพื่อให้การเบิกจ่ายดำเนินไปได้อย่างราบรื่น",
    },
    {
      title: "5. เงื่อนไขและกำหนดระยะเวลาการชำระคืน",
      body: "ผู้กู้ยืมรับทราบและยินยอมชำระเงินกู้ยืมคืนเต็มจำนวนตามงวดการผ่อนชำระที่ระบุไว้ในคำร้อง โดยงวดแรกจะเริ่มนับตั้งแต่วันที่คณะฯ กำหนดในหนังสือแจ้งผลการอนุมัติ ทั้งนี้ ผู้กู้ยืมสามารถชำระคืนผ่านช่องทางที่คณะฯ กำหนดพร้อมแนบหลักฐานการโอนเงิน (สลิป) เพื่อการตรวจสอบและยืนยันยอดการชำระในระบบ กรณีผู้กู้ยืมมีความประสงค์ผ่อนผันหรือขยายระยะเวลาชำระคืนเนื่องจากเหตุจำเป็น สามารถยื่นคำร้องชี้แจงเหตุผลต่อคณะฯ เพื่อพิจารณาเป็นรายกรณีไปได้",
    },
    {
      title: "6. การชำระคืนล่าช้าและประวัติการชำระเงิน",
      body: "ข้อกำหนดฉบับนี้มิได้กำหนดบทลงโทษใด ๆ ต่อผู้กู้ยืมกรณีชำระเงินคืนล่าช้า อย่างไรก็ตาม ระบบจะบันทึกวันที่ชำระคืนจริงเทียบกับกำหนดชำระของแต่ละงวดไว้เป็นประวัติการชำระเงินของผู้กู้ยืม ประวัติดังกล่าวจะถูกใช้เป็นข้อมูลประกอบการพิจารณาของอาจารย์ที่ปรึกษา เจ้าหน้าที่ และผู้บริหาร ในการพิจารณาอนุมัติคำร้องขอกู้ยืมครั้งถัดไปของผู้กู้ยืมเท่านั้น",
    },
    {
      title: "7. การใช้ข้อมูลส่วนบุคคล",
      body: "ผู้กู้ยืมรับทราบและยินยอมให้คณะฯ จัดเก็บ ใช้ และประมวลผลข้อมูลส่วนบุคคลที่ให้ไว้ในคำร้องขอกู้ยืม เพื่อวัตถุประสงค์ในการพิจารณาอนุมัติ การติดตามสถานะคำร้อง การแจ้งเตือนผลการพิจารณา และการดำเนินงานที่เกี่ยวข้องกับกองทุนเงินกู้ยืมเท่านั้น โดยคณะฯ จะดำเนินการเก็บรักษาข้อมูลดังกล่าวตามมาตรการรักษาความปลอดภัยที่เหมาะสม และจะไม่นำข้อมูลไปใช้นอกเหนือจากวัตถุประสงค์ที่ระบุไว้ในเอกสารฉบับนี้",
    },
    {
      title: "8. การเปลี่ยนแปลงหรือยกเลิกคำร้อง",
      body: "ก่อนที่คำร้องขอกู้ยืมจะได้รับการอนุมัติครบทุกขั้นตอน ผู้กู้ยืมสามารถขอยกเลิกคำร้อง หรือขอแก้ไขข้อมูลในคำร้องผ่านระบบได้ตามความประสงค์ ในกรณีที่คำร้องถูกส่งกลับเพื่อขอข้อมูลเพิ่มเติมหรือแก้ไขจากผู้พิจารณาในขั้นตอนใดขั้นตอนหนึ่ง ผู้กู้ยืมตกลงดำเนินการแก้ไขและยื่นคำร้องกลับเข้าสู่ระบบภายในระยะเวลาที่เหมาะสม เพื่อมิให้กระบวนการพิจารณาล่าช้าเกินควร",
    },
    {
      title: "9. บททั่วไป",
      body: "ข้อกำหนดและเงื่อนไขฉบับนี้จัดทำขึ้นเพื่ออำนวยความสะดวกและสร้างความเข้าใจที่ตรงกันระหว่างผู้กู้ยืมและคณะฯ ในกระบวนการกู้ยืมเงิน หากมีข้อสงสัยหรือประเด็นใดที่มิได้ระบุไว้ในเอกสารฉบับนี้ ผู้กู้ยืมสามารถติดต่อสอบถามอาจารย์ที่ปรึกษาหรือเจ้าหน้าที่ผู้รับผิดชอบของคณะฯ เพื่อขอคำชี้แจงเพิ่มเติมได้ในทุกขั้นตอน",
    },
  ],
  acceptanceLabel:
    "ข้าพเจ้าผู้ยื่นคำร้องขอกู้ยืมเงินได้อ่านและทำความเข้าใจข้อกำหนดและเงื่อนไขการกู้ยืมเงินข้างต้นโดยละเอียดครบถ้วนแล้วทุกข้อ และด้วยความสมัครใจ ข้าพเจ้าขอให้ความยินยอมที่จะปฏิบัติตามหลักเกณฑ์ ข้อตกลง และเงื่อนไขดังกล่าวตามที่คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่กำหนดไว้ทุกประการ ทั้งนี้ ข้าพเจ้ารับรองว่าข้อมูลที่จะให้ไว้ในคำร้องขอกู้ยืมเป็นความจริงทุกประการ",
};

export const tempLoanAgreementEn: typeof tempLoanAgreement = {
  title: "Terms and Conditions of the Loan",
  organization: "Faculty of Nursing, Chiang Mai University",
  introduction:
    "This document sets out the rules, agreement, and conditions governing loans issued by the Faculty of Nursing, Chiang Mai University (the \"Faculty\"). The student submitting a loan request (the \"Borrower\") must read, understand, and consent to every condition below in full before proceeding to enter information and submit a loan request in the next step. This document is issued in the spirit of assisting and easing the financial difficulties of students, and does not impose any penalty or legal liability.",
  sections: [
    {
      title: "1. Purpose of the Loan",
      body: "A loan approved under these conditions is intended to assist and ease the Borrower's genuine financial need. The Borrower states the purpose of the loan in the request. This purpose is not limited to education-related expenses and may cover any other genuine need of the Borrower as stated in the request.",
    },
    {
      title: "2. Eligibility of the Applicant",
      body: "An applicant must be currently enrolled as a student at the Faculty of Nursing, Chiang Mai University, and must provide personal information, contact details, bank account details for receiving the transfer, and advisor information accurately, completely, and truthfully, for the purpose of review and communication by the Faculty at every stage of the loan process.",
    },
    {
      title: "3. Review and Approval Process",
      body: "A submitted loan request is reviewed in sequence by the advisor, the responsible staff member, and the Faculty's administration. The Faculty reserves the right to approve the requested amount in full or in part as appropriate, taking into account the Borrower's need and the fund's available budget at the time. If the Faculty requires additional information or documents to support its review, the Borrower agrees to provide them within the requested timeframe.",
    },
    {
      title: "4. Disbursement of the Loan",
      body: "Once a loan request has been approved at every stage, the Faculty will transfer the funds to the bank account name, account number, and bank stated by the Borrower in the request. The Borrower is responsible for verifying the accuracy of the bank account details before submitting the request. If the account details are incorrect or the transfer cannot be completed, the Borrower agrees to promptly notify the Faculty so the disbursement can proceed smoothly.",
    },
    {
      title: "5. Repayment Terms and Schedule",
      body: "The Borrower acknowledges and agrees to repay the loan in full according to the installment schedule stated in the request, with the first installment counted from the date specified in the Faculty's approval notice. The Borrower may repay through the channel designated by the Faculty, attaching proof of transfer (a slip) so the payment can be verified and confirmed in the system. If the Borrower wishes to request a grace period or an extension of the repayment schedule due to genuine necessity, a request with supporting reasons may be submitted to the Faculty for case-by-case consideration.",
    },
    {
      title: "6. Late Repayment and Payment History",
      body: "This document does not impose any penalty on the Borrower for a late repayment. However, the system records the actual repayment date against each installment's due date as part of the Borrower's payment history. This history is used solely as information to support the advisor's, staff's, and administration's review of the Borrower's future loan requests.",
    },
    {
      title: "7. Use of Personal Data",
      body: "The Borrower acknowledges and consents to the Faculty collecting, using, and processing the personal data provided in the loan request for the purposes of reviewing the request, tracking its status, notifying the outcome of the review, and other operations related to the loan fund only. The Faculty will keep this data under appropriate security measures and will not use it beyond the purposes stated in this document.",
    },
    {
      title: "8. Amendment or Cancellation of a Request",
      body: "Before a loan request has been approved at every stage, the Borrower may cancel the request or request to amend its information through the system as desired. If a request is returned by a reviewer at any stage for additional information or correction, the Borrower agrees to make the correction and resubmit the request within a reasonable time so the review process is not unduly delayed.",
    },
    {
      title: "9. General Provisions",
      body: "These terms and conditions are issued to facilitate and establish a shared understanding between the Borrower and the Faculty throughout the loan process. For any question or matter not addressed in this document, the Borrower may contact the advisor or the responsible staff member of the Faculty for further clarification at any stage.",
    },
  ],
  acceptanceLabel:
    "I, the applicant submitting this loan request, have read and fully understood every condition of the terms and conditions of the loan above, and I voluntarily consent to comply with the rules, agreement, and conditions set out by the Faculty of Nursing, Chiang Mai University in full. I further certify that the information I provide in this loan request is true in every respect.",
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

export const tempLoanApplicationLimit = 500_000;

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
    commentTitle: "ความคิดเห็นของอาจารย์ที่ปรึกษา",
    comment: "ตรวจสอบข้อมูลแล้ว เห็นควรอนุมัติคำร้อง",
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
    commentTitle: "ความคิดเห็นของผู้บริหาร",
    comment: "อนุมัติตามความจำเป็นและความเหมาะสมของคำร้อง",
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
    statusLabel: "ปฏิเสธ · อาจารย์ที่ปรึกษา",
    statusType: "rejectedExecutive",
    submittedAt: "ยื่นเมื่อ 18 ธ.ค. 2569 10:00 น.",
    purpose: "ค่าเทอมภาคเรียนที่ 1/2569",
    amountLabel: "จำนวนที่ขอกู้",
    amount: "3,000",
  },
  {
    requestNumber: "SL-2568-0002",
    statusLabel: "รออาจารย์ที่ปรึกษา",
    statusType: "waitingAdvisorApproval",
    submittedAt: "ยื่นเมื่อ 20 ม.ค. 2570 09:30 น.",
    purpose: "ค่าใช้จ่ายระหว่างการศึกษา",
    amountLabel: "จำนวนที่ขอกู้",
    amount: "5,000",
  },
];
