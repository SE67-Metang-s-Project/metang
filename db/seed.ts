import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  ApprovalStep,
  Decision,
  LoanStatus,
  Prisma,
  PrismaClient,
  UserRoleName,
} from "../lib/generated/prisma/client";
import { getEducationLevelCode } from "../lib/student-code";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const reset = process.argv.includes("--reset");
const now = new Date();
const day = 86_400_000;
const dateFromNow = (days: number) => new Date(now.getTime() + days * day);
const id = (value: number) => `00000000-0000-0000-0000-${String(value).padStart(12, "0")}`;
const loanId = (value: number) => `REQ20260906${String(value - 200).padStart(4, "0")}`;

// Real-looking people, so lists, timelines and emails read like the real thing. Ids stay fixed:
// lib/loan-auth.ts's dev bypass and the Bruno walks address fixtures by id (and Bruno's submit
// steps send advisor 4's fullNameTh). Accounts are first.last, a shape real CMU accounts
// (first_xx) never take, so a real sign-in can't be matched to a fixture.
const accountOf = (fullNameEn: string) => fullNameEn.toLowerCase().replace(" ", ".");
const person = (
  number: number,
  fullNameTh: string,
  fullNameEn: string,
): Prisma.AppUserCreateManyInput => {
  const account = accountOf(fullNameEn);
  return { id: id(number), email: `${account}@cmu.ac.th`, cmuAccount: account, fullNameTh, fullNameEn };
};

// 1-5 are the dev-bypass and Bruno staff; 6-9 give the lists and the history more than one face.
const staff = [
  person(1, "วรรณภา ศรีธัญรัตน์", "Wannapa Srithanyarat"), // executive + advisor
  person(2, "ธนวัฒน์ อินทรประเสริฐ", "Thanawat Intaraprasert"), // super_admin
  person(3, "กมลชนก แสงทอง", "Kamonchanok Saengthong"), // admin
  person(4, "สุภาวดี วงศ์คำ", "Supawadee Wongkham"), // advisor
  person(5, "ประเสริฐ ชัยวงศ์", "Prasert Chaiwong"), // advisor
  person(6, "นภัสสร ธรรมรักษ์", "Napatsorn Thammarak"), // advisor
  person(7, "อรุณี มณีรัตน์", "Arunee Maneerat"), // advisor
  person(8, "ศิริพร คำปัน", "Siriporn Khampan"), // admin
  person(9, "ปิยะพงษ์ ใจมั่น", "Piyapong Jaiman"), // admin
];
const HISTORY_ADVISORS = [id(4), id(4), id(5), id(6), id(6), id(7)];
const HISTORY_ADMINS = [id(3), id(3), id(3), id(8), id(8), id(9), id(2)];

// Students own fixture loans 201-211, one each; the first is the dev-bypass student
// (lib/loan-auth.ts). Students are not app_user rows: each loan carries its borrower. Codes follow
// the year of study (year 1 = 69 in academic year 2569).
const fixtureStudents = [
  ["พิมพ์ชนก สุขประเสริฐ", "Pimchanok Sukprasert", 3, "670610143"],
  ["ธนกฤต บุญเรือง", "Thanakrit Boonruang", 2, "680610087"],
  ["ชนิดา แก้วประเสริฐ", "Chanida Kaewprasert", 4, "660610021"],
  ["ณัฐวุฒิ คำมา", "Nattawut Khamma", 1, "690610219"],
  ["กัญญาณัฐ ปัญญาวงศ์", "Kanyanat Panyawong", 3, "670610164"],
  ["ศุภกร ทองดี", "Supakorn Thongdee", 2, "680610098"],
  ["อริสา จันทร์หอม", "Arisa Chanhom", 4, "660610052"],
  ["วรวิทย์ ศรีสวัสดิ์", "Worawit Srisawat", 3, "670610175"],
  ["ปวีณา อินต๊ะวงศ์", "Paweena Intawong", 1, "690610231"],
  ["จิรายุ มหาวงศ์", "Jirayu Mahawong", 2, "680610046"],
  ["เบญญาภา ธิวงค์", "Benyapa Thiwong", 4, "660610112"],
] as const;
const fixturePhones = ["0812249035", "0954418702", "0886231947", "0617720384", "0829903156", null, "0931185420", "0847762019", null, "0892054471", "0643398120"];

const users: Prisma.AppUserCreateManyInput[] = staff;

/** The borrower columns of a loan_request. */
const borrower = (studentCode: string, nameTh: string, nameEn: string, email: string, phone: string | null) => ({
  studentCode,
  studentNameTh: nameTh,
  studentNameEn: nameEn,
  studentEmail: email,
  studentPhone: phone,
  studentEducationLevel: getEducationLevelCode(studentCode),
});

const roles: Prisma.UserRoleCreateManyInput[] = [
  { userId: id(1), role: UserRoleName.executive, grantedBy: id(2) },
  { userId: id(1), role: UserRoleName.advisor, grantedBy: id(2) },
  { userId: id(2), role: UserRoleName.super_admin },
  { userId: id(3), role: UserRoleName.admin, grantedBy: id(2) },
  ...[4, 5, 6, 7].map((number) => ({ userId: id(number), role: UserRoleName.advisor, grantedBy: id(2) })),
  ...[8, 9].map((number) => ({ userId: id(number), role: UserRoleName.admin, grantedBy: id(2) })),
];

const loanScenarios = [
  [201, LoanStatus.draft, 1500, null, 1, 30],
  [202, LoanStatus.returned, 2000, null, 2, 30],
  [203, LoanStatus.pending_advisor, 2500, null, 1, 25],
  [204, LoanStatus.pending_admin, 3000, null, 3, 24],
  [205, LoanStatus.pending_executive, 3500, 3200, 2, 22],
  [206, LoanStatus.pending_disbursement, 4000, 3800, 2, 20],
  [207, LoanStatus.disbursed, 4500, 4500, 3, -30],
  [208, LoanStatus.closed, 3000, 3000, 3, -90],
  [209, LoanStatus.rejected, 2800, null, 2, 15],
  [210, LoanStatus.cancelled, 1800, null, 1, 28],
  [211, LoanStatus.cancelled, 2200, null, 2, 18],
] as const;

// Purpose, bank and account per fixture loan 201-211.
const fixtureLoanDetails = [
  ["ค่าหอพักประจำภาคการศึกษาที่ 2", "ธนาคารกรุงไทย", "5670123481"],
  ["ค่าเดินทางไปฝึกปฏิบัติงานที่โรงพยาบาลนครพิงค์", "ธนาคารกสิกรไทย", "0381294756"],
  ["ซื้อชุดปฏิบัติงานและอุปกรณ์การพยาบาล", "ธนาคารไทยพาณิชย์", "4072218395"],
  ["ค่าหนังสือและตำราเรียนวิชาการพยาบาลผู้ใหญ่", "ธนาคารกรุงเทพ", "2314470618"],
  ["ค่าใช้จ่ายระหว่างรอเงินกู้ กยศ.", "ธนาคารออมสิน", "0209835174"],
  ["ค่ารักษาพยาบาลฉุกเฉินของมารดา", "ธนาคารกรุงไทย", "5671980243"],
  ["ค่าซ่อมโน้ตบุ๊กที่ใช้เรียน", "ธนาคารกสิกรไทย", "0384417702"],
  ["ค่าลงทะเบียนเรียนภาคฤดูร้อน", "ธนาคารกรุงไทย", "5675502916"],
  ["ค่าเช่าที่พักใกล้แหล่งฝึกที่ลำพูน", "ธนาคารไทยพาณิชย์", "4079136620"],
  ["ค่าเดินทางกลับบ้านเนื่องจากครอบครัวเจ็บป่วย", "ธนาคารกรุงเทพ", "2318842057"],
  ["ค่าสมัครสอบใบประกอบวิชาชีพการพยาบาล", "ธนาคารออมสิน", "0204471389"],
] as const;

const loans: Prisma.LoanRequestCreateManyInput[] = loanScenarios.map(
  ([number, status, amount, approvedAmount, installmentCount, dueOffset]) => ({
    id: loanId(number),
    ...(([th, en, , studentCode]) =>
      borrower(studentCode, th, en, `${accountOf(en)}@cmu.ac.th`, fixturePhones[number - 201]))(
      fixtureStudents[number - 201],
    ),
    advisorId: [208, 209].includes(number) ? id(5) : id(4),
    studentYear: fixtureStudents[number - 201][2],
    amount,
    approvedAmount,
    purpose: fixtureLoanDetails[number - 201][0],
    bankName: fixtureLoanDetails[number - 201][1],
    bankAccountNo: fixtureLoanDetails[number - 201][2],
    bankAccountName: fixtureStudents[number - 201][0],
    installmentCount,
    firstDueDate: dateFromNow(dueOffset),
    status,
    assignedAdminId: status === LoanStatus.pending_executive ? id(3) : null,
    submittedAt: [201, 210].includes(number) ? null : dateFromNow(-7),
    cancelledAt: status === LoanStatus.cancelled ? dateFromNow(-1) : null,
    disbursedAt:
      status === LoanStatus.disbursed || status === LoanStatus.closed ? dateFromNow(-60) : null,
    // Both have payments, so the migration's backfill rule counts them as received.
    transferConfirmedAt:
      status === LoanStatus.disbursed || status === LoanStatus.closed ? dateFromNow(-60) : null,
    closedAt: status === LoanStatus.closed ? dateFromNow(-10) : null,
    createdAt: dateFromNow(-14),
  }),
);

const approvalRows = [
  [202, ApprovalStep.advisor, Decision.returned, 4, "กรุณาแนบรายละเอียดค่าใช้จ่าย"],
  [203, ApprovalStep.advisor, Decision.pending, null, null],
  [204, ApprovalStep.advisor, Decision.approved, 4, null],
  [204, ApprovalStep.admin, Decision.pending, null, null],
  [205, ApprovalStep.advisor, Decision.approved, 4, null],
  [205, ApprovalStep.admin, Decision.approved, 3, "อนุมัติลดเหลือ 3,200 บาท"],
  [205, ApprovalStep.executive, Decision.pending, null, null],
  [206, ApprovalStep.advisor, Decision.approved, 4, null],
  [206, ApprovalStep.admin, Decision.approved, 3, null],
  [206, ApprovalStep.executive, Decision.approved, 1, null],
  [207, ApprovalStep.advisor, Decision.approved, 4, null],
  [207, ApprovalStep.admin, Decision.approved, 3, null],
  [207, ApprovalStep.executive, Decision.approved, 1, null],
  [208, ApprovalStep.advisor, Decision.approved, 5, null],
  [208, ApprovalStep.admin, Decision.approved, 3, null],
  [208, ApprovalStep.executive, Decision.approved, 1, null],
  [209, ApprovalStep.advisor, Decision.approved, 5, null],
  [209, ApprovalStep.admin, Decision.rejected, 3, "เอกสารไม่ผ่านเกณฑ์"],
] as const;

const approvals: Prisma.LoanApprovalCreateManyInput[] = approvalRows.map(
  ([loanNumber, step, decision, actorNumber, comment]) => ({
    loanId: loanId(loanNumber),
    step,
    decision,
    decidedBy: actorNumber ? id(actorNumber) : null,
    decidedAt: actorNumber ? dateFromNow(-3) : null,
    comment,
  }),
);

const installments: Prisma.InstallmentCreateManyInput[] = [
  { loanId: loanId(207), seq: 1, dueDate: dateFromNow(-30), amountDue: 1500, amountPaid: 500 },
  { loanId: loanId(207), seq: 2, dueDate: dateFromNow(10), amountDue: 1500, amountPaid: 0 },
  { loanId: loanId(207), seq: 3, dueDate: dateFromNow(40), amountDue: 1500, amountPaid: 0 },
  {
    loanId: loanId(208),
    seq: 1,
    dueDate: dateFromNow(-90),
    amountDue: 1000,
    amountPaid: 1000,
    settledAt: dateFromNow(-92),
  },
  {
    loanId: loanId(208),
    seq: 2,
    dueDate: dateFromNow(-60),
    amountDue: 1000,
    amountPaid: 1000,
    settledAt: dateFromNow(-55),
  },
  {
    loanId: loanId(208),
    seq: 3,
    dueDate: dateFromNow(-30),
    amountDue: 1000,
    amountPaid: 1000,
    settledAt: dateFromNow(-30),
  },
];

// History for the dashboard charts: 10-20 requests a month for the 24 months up to this one, with
// random dates, amounts, students and outcomes. Each request is drawn as a story - approved all the
// way, rejected or returned at some step, or cancelled - and then cut off at the present: whatever
// has not happened by now is still pending, so recent months hold the open requests and older ones
// are mostly settled. Repayment is on time, late, or stops part-way.
// - Rebuilt on every run: main() first deletes all seed-made rows (see wipeMockData), and the draw
//   is seeded by the month, so a re-run in the same month gives the same rows.
// - Own students (emails @example.com), numbered from the calendar month. Open requests always get a new
//   student (for one_open_loan_per_student); settled ones sometimes reuse an earlier borrower.
// - Ledger: a top-up at the start of each month covers that month's payouts, so the running balance
//   never dips below zero, and a final reconciliation row leaves the history's net at exactly what
//   its open requests reserve - `available` capacity stays what the fixtures give.
// - Ids are REQ<Bangkok date>9NNN: never taken from the loan id sequence, and a real id on a past
//   date could only clash once the sequence passes 9000.
const HISTORY_MONTHS = 24;
const HISTORY_MIN_PER_MONTH = 10;
const HISTORY_MAX_PER_MONTH = 20;
const HISTORY_NOTE_PREFIX = "mock history"; // every history-only ledger note starts with this
const hour = 3_600_000;
const monthKey = (time: number) => new Date(time).toISOString().slice(0, 7);

const FIRST_NAMES = [
  ["ไมค์", "Mike"], ["แอบบี้", "Abby"], ["พลอย", "Ploy"], ["แบงค์", "Bank"], ["มิ้นท์", "Mint"],
  ["เจมส์", "James"], ["ซาร่า", "Sara"], ["ต้นกล้า", "Tonkla"], ["เอมมี่", "Emmy"], ["ภูมิ", "Poom"],
  ["ลิลลี่", "Lily"], ["ออสการ์", "Oscar"], ["น้ำฝน", "Namfon"], ["แพรวา", "Praewa"], ["ธีรภัทร", "Teerapat"],
  ["กันต์", "Kan"], ["เบลล์", "Belle"], ["นิว", "New"], ["ขวัญข้าว", "Kwankhao"], ["ไอริณ", "Irin"],
  ["ปุณณวิช", "Punnawit"], ["แพท", "Pat"], ["เฟิร์น", "Fern"], ["โจอี้", "Joey"], ["มายด์", "Mind"],
  ["ต้าร์", "Tar"], ["ชมพู่", "Chompoo"], ["อชิรญา", "Achiraya"], ["ลีโอ", "Leo"], ["ปาล์ม", "Palm"],
  ["ณิชา", "Nicha"], ["คริส", "Chris"], ["ใบเตย", "Baitoey"], ["ฟ้าใส", "Fahsai"], ["เคน", "Ken"],
  ["ข้าวหอม", "Khaohom"], ["ดาริน", "Darin"], ["ไทเกอร์", "Tiger"], ["แนน", "Nan"], ["ภัทรา", "Pattra"],
] as const;
const LAST_NAMES = [
  ["ศรีสุข", "Srisuk"], ["วงศ์ใหญ่", "Wongyai"], ["ใจดี", "Jaidee"], ["แก้วมณี", "Kaewmanee"],
  ["ทองคำ", "Thongkham"], ["บุญมา", "Boonma"], ["สายสุวรรณ", "Saisuwan"], ["พรหมมา", "Prommar"],
  ["อินทร์แก้ว", "Inkaew"], ["จันทร์เพ็ญ", "Chanpen"], ["ปัญญาดี", "Panyadee"], ["สุขเจริญ", "Sukcharoen"],
  ["คำแสน", "Khamsaen"], ["ศรีวิชัย", "Sriwichai"], ["ดวงดี", "Duangdee"], ["ชัยมงคล", "Chaimongkol"],
  ["เรืองศรี", "Ruangsri"], ["มณีวงศ์", "Maneewong"], ["รัตนพันธ์", "Rattanapan"], ["ธนากร", "Thanakorn"],
  ["กิตติคุณ", "Kittikun"], ["ภูผา", "Phupha"], ["ลำเนาไพร", "Lamnaoprai"], ["สมบูรณ์", "Somboon"],
  ["นาคสวัสดิ์", "Naksawat"], ["เวียงแก้ว", "Wiangkaew"], ["ปิ่นทอง", "Pinthong"], ["คงมั่น", "Kongman"],
  ["ฟ้าคราม", "Fahkram"], ["ยอดยิ่ง", "Yodying"],
] as const;
const PURPOSES = [
  "ค่าหอพักประจำภาคการศึกษา",
  "ค่าเดินทางไปฝึกปฏิบัติงานที่โรงพยาบาล",
  "ซื้อชุดปฏิบัติงานและอุปกรณ์การพยาบาล",
  "ค่าหนังสือและตำราเรียน",
  "ค่ารักษาพยาบาลฉุกเฉิน",
  "ค่าใช้จ่ายระหว่างรอเงินกู้ กยศ.",
  "ค่าอาหารและค่าครองชีพประจำเดือน",
  "ค่าซ่อมโน้ตบุ๊กที่ใช้เรียน",
  "ค่าเดินทางกลับบ้านเนื่องจากครอบครัวเจ็บป่วย",
  "ค่าสมัครสอบใบประกอบวิชาชีพ",
  "ค่าลงทะเบียนเรียนภาคฤดูร้อน",
  "ค่าเช่าที่พักใกล้แหล่งฝึก",
];
const REJECT_COMMENTS = [
  "เอกสารประกอบไม่ครบถ้วน",
  "วัตถุประสงค์ไม่ตรงตามเกณฑ์ของกองทุน",
  "ยังมียอดค้างชำระจากคำร้องก่อนหน้า",
  "ยอดขอกู้สูงเกินความจำเป็นตามเอกสาร",
];
const RETURN_COMMENTS = [
  "กรุณาแนบใบแจ้งค่าใช้จ่าย",
  "กรุณาระบุรายละเอียดค่าใช้จ่ายให้ชัดเจน",
  "เลขบัญชีไม่ตรงกับชื่อผู้กู้ กรุณาตรวจสอบ",
];
const BANKS = ["ธนาคารกรุงไทย", "ธนาคารกสิกรไทย", "ธนาคารไทยพาณิชย์", "ธนาคารกรุงเทพ", "ธนาคารออมสิน"];

// mulberry32: a small seeded PRNG, so a month's draw is repeatable.
function seededRandom(seedText: string) {
  let seed = [...seedText].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 0x01000193), 0x811c9dc5);
  const next = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(values: readonly T[]) => values[Math.floor(next() * values.length)],
    chance: (probability: number) => next() < probability,
    days: (min: number, max: number) => (min + next() * (max - min)) * day,
  };
}

// CMU academic years start in June, in the Buddhist era.
const academicYear = (time: number) => {
  const date = new Date(time + 7 * hour);
  return date.getUTCFullYear() + 543 - (date.getUTCMonth() < 5 ? 1 : 0);
};

type HistoryStudent = { name: string; entryYear: number; borrower: ReturnType<typeof borrower> };
type Story = "approved" | "rejected" | "cancelled" | "returned";
const STORIES = ([["approved", 38], ["rejected", 5], ["cancelled", 5], ["returned", 2]] as const).flatMap(
  ([story, weight]) => Array<Story>(weight).fill(story),
);

function buildHistory() {
  const perDay = new Map<string, number>(); // the next 9NNN suffix per Bangkok date
  const loans: Prisma.LoanRequestCreateManyInput[] = [];
  const approvals: Prisma.LoanApprovalCreateManyInput[] = [];
  const installments: Prisma.InstallmentCreateManyInput[] = [];
  // installmentId is filled in once the installments exist.
  const payments: (Omit<Prisma.PaymentCreateManyInput, "installmentId"> & { seq: number })[] = [];
  const ledger: Prisma.FundTransactionCreateManyInput[] = [];
  const payoutsByMonth = new Map<string, number>();
  const pastBorrowers: HistoryStudent[] = [];
  let net = 0; // what the history rows add to the ledger, before the top-ups
  let reserved = 0; // what its open, not-yet-disbursed requests reserve (computeFundCapacity)
  const cutoff = now.getTime() - hour; // nothing happens after this

  const newStudent = (number: number, rand: ReturnType<typeof seededRandom>, createdAt: number): HistoryStudent => {
    const names = seededRandom(`student-${number}`);
    const [firstTh, firstEn] = names.pick(FIRST_NAMES);
    const [lastTh, lastEn] = names.pick(LAST_NAMES);
    const handle = `${firstEn}.${lastEn}`.toLowerCase();
    const entryYear = academicYear(createdAt) - rand.pick([0, 0, 1, 1, 2, 3]);
    const name = `${firstTh} ${lastTh}`;
    const degree = names.pick(["1", "1", "1", "1", "1", "3", "3", "5"]);
    const phone = names.chance(0.1) ? null : `0${names.pick([6, 8, 9])}${String(names.int(0, 99_999_999)).padStart(8, "0")}`;
    return {
      name,
      entryYear,
      borrower: borrower(
        `${entryYear % 100}06${degree}${String(5000 + number).padStart(4, "0").slice(-4)}`,
        name,
        `${firstEn} ${lastEn}`,
        `${handle}.${number}@example.com`,
        phone,
      ),
    };
  };

  for (let back = HISTORY_MONTHS - 1; back >= 0; back--) {
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() - back; // Date.UTC rolls negative months into earlier years
    const monthStart = Date.UTC(year, month, 1);
    const tag = monthKey(monthStart);
    const rand = seededRandom(tag);
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const latestDay = back === 0 ? new Date(cutoff).getUTCDate() : lastDay;
    // Months since January 2024, so every month owns its own block of student numbers.
    const monthIndex = (year - 2024) * 12 + month;

    // The current month only gets its share so far.
    const count = Math.max(1, Math.round((rand.int(HISTORY_MIN_PER_MONTH, HISTORY_MAX_PER_MONTH) * latestDay) / lastDay));
    const createdTimes = Array.from({ length: count }, () => {
      let time = 0;
      // Weekdays are busier: a weekend draw gets one re-roll. 08:00-20:59 Bangkok.
      for (let attempt = 0; attempt < 2; attempt++) {
        time = Date.UTC(year, month, rand.int(1, latestDay), rand.int(8, 20) - 7, rand.int(0, 59));
        const weekday = new Date(time + 7 * hour).getUTCDay();
        if (weekday !== 0 && weekday !== 6) break;
      }
      return Math.min(time, cutoff - rand.days(0.1, 0.5));
    }).sort((a, b) => a - b);

    createdTimes.forEach((createdAt, slot) => {
      const date = new Date(createdAt + 7 * hour).toISOString().slice(0, 10).replaceAll("-", "");
      const suffix = 9000 + (perDay.get(date) ?? 0);
      perDay.set(date, suffix - 8999);
      const loanIdValue = `REQ${date}${suffix}`;

      // The story, before the present cuts it off.
      const story = rand.pick(STORIES);
      const advisorAt = createdAt + rand.days(0.1, 3);
      const adminAt = advisorAt + rand.days(0.2, 4);
      const executiveAt = adminAt + rand.days(0.2, 3);
      const stepTimes = [advisorAt, adminAt, executiveAt, executiveAt + rand.days(0.5, 5)]; // last: payout
      const stopStep = story === "rejected" ? rand.pick([0, 0, 1, 1, 1, 2]) : story === "returned" ? rand.pick([0, 0, 1]) : 3;
      const cancelAt = story === "cancelled" ? createdAt + rand.days(0.3, 6) : Infinity;

      // Steps done by now (and before a cancellation); a rejection or return is the stop step's decision.
      let done = 0;
      while (done < 4 && stepTimes[done] < Math.min(cutoff, cancelAt) && (done < stopStep || story === "approved")) done++;
      const decided = story !== "approved" && story !== "cancelled" && done === stopStep && stepTimes[stopStep] < cutoff;
      const cancelled = story === "cancelled" && cancelAt < cutoff && done < 4;
      // An old request left returned would have been cancelled by now.
      const abandoned = decided && story === "returned" && back >= 2;

      let status: LoanStatus;
      if (cancelled || abandoned) status = LoanStatus.cancelled;
      else if (decided) status = story === "rejected" ? LoanStatus.rejected : LoanStatus.returned;
      else status = [LoanStatus.pending_advisor, LoanStatus.pending_admin, LoanStatus.pending_executive, LoanStatus.pending_disbursement, LoanStatus.disbursed][done];

      const amount = rand.chance(0.15) ? rand.int(11, 30) * 500 : rand.chance(0.45) ? rand.int(1, 10) * 500 : rand.int(5, 50) * 100;
      const installmentCount = rand.pick([1, 2, 2, 3, 3]);
      const approvedAmount =
        done >= 2 ? (rand.chance(0.75) ? amount : Math.max(500, amount - rand.int(1, 5) * 100)) : null;
      const advisorId = rand.pick(HISTORY_ADVISORS);
      const adminId = rand.pick(HISTORY_ADMINS);

      [ApprovalStep.advisor, ApprovalStep.admin, ApprovalStep.executive].forEach((step, index) => {
        if (index < done) {
          approvals.push({
            loanId: loanIdValue,
            step,
            decision: Decision.approved,
            decidedBy: [advisorId, adminId, id(1)][index],
            decidedAt: new Date(stepTimes[index]),
            comment: index === 1 && approvedAmount !== amount ? `อนุมัติลดเหลือ ${approvedAmount} บาท` : null,
          });
        } else if (index === done && (decided || status.startsWith("pending_"))) {
          approvals.push({
            loanId: loanIdValue,
            step,
            decision: decided ? (story === "rejected" ? Decision.rejected : Decision.returned) : Decision.pending,
            decidedBy: decided ? [advisorId, adminId, id(1)][index] : null,
            decidedAt: decided ? new Date(stepTimes[index]) : null,
            comment: decided ? rand.pick(story === "rejected" ? REJECT_COMMENTS : RETURN_COMMENTS) : null,
          });
        }
      });

      const disbursedAt = status === LoanStatus.disbursed ? stepTimes[3] : null;
      let closedAt: number | null = null;
      if (disbursedAt !== null && approvedAmount !== null) {
        net -= approvedAmount;
        const payoutMonth = monthKey(disbursedAt);
        payoutsByMonth.set(payoutMonth, (payoutsByMonth.get(payoutMonth) ?? 0) + approvedAmount);
        ledger.push({
          kind: "disbursement",
          amount: approvedAmount,
          direction: -1,
          loanId: loanIdValue,
          performedBy: adminId,
          createdAt: new Date(disbursedAt),
        });

        const behaviour = rand.pick(["on_time", "on_time", "on_time", "on_time", "late", "late", "stops"] as const);
        const paysUpTo = behaviour === "stops" ? rand.int(0, installmentCount - 1) : installmentCount;
        const share = Math.floor(approvedAmount / installmentCount / 100) * 100;
        let allSettled = true;
        for (let seq = 1; seq <= installmentCount; seq++) {
          const amountDue = seq === installmentCount ? approvedAmount - share * (installmentCount - 1) : share;
          const dueDate = disbursedAt + 30 * seq * day;
          const paidAt = behaviour === "late" ? dueDate + rand.days(3, 40) : dueDate - rand.days(0, 10);
          // Sometimes an installment comes in two transfers.
          const parts =
            amountDue >= 200 && rand.chance(0.15)
              ? [
                  { amount: Math.floor(amountDue / 200) * 100, paidAt: paidAt - rand.days(3, 12) },
                  { amount: amountDue - Math.floor(amountDue / 200) * 100, paidAt },
                ]
              : [{ amount: amountDue, paidAt }];
          let amountPaid = 0;
          let settledAt: number | null = null;
          for (const part of parts) {
            const confirmedAt = part.paidAt + rand.days(0.1, 3);
            if (seq > paysUpTo || confirmedAt >= cutoff) break;
            const paymentId = randomUUID();
            amountPaid += part.amount;
            settledAt = confirmedAt;
            net += part.amount;
            payments.push({
              id: paymentId,
              loanId: loanIdValue,
              seq,
              amount: part.amount,
              status: "confirmed",
              confirmedBy: adminId,
              confirmedAt: new Date(confirmedAt),
              paidAt: new Date(part.paidAt),
              createdAt: new Date(part.paidAt),
            });
            ledger.push({
              kind: "repayment",
              amount: part.amount,
              direction: 1,
              loanId: loanIdValue,
              paymentId,
              performedBy: adminId,
              createdAt: new Date(confirmedAt),
            });
          }
          if (amountPaid !== amountDue) allSettled = false;
          installments.push({
            loanId: loanIdValue,
            seq,
            dueDate: new Date(dueDate),
            amountDue,
            amountPaid,
            settledAt: amountPaid === amountDue && settledAt !== null ? new Date(settledAt) : null,
          });
          if (allSettled) closedAt = settledAt;
        }
        if (!allSettled) closedAt = null;
      } else if (status !== LoanStatus.cancelled && status !== LoanStatus.rejected) {
        reserved += status === LoanStatus.pending_disbursement ? (approvedAmount ?? amount) : amount;
      }

      // A settled request (closed, rejected, cancelled) sometimes comes from an earlier borrower
      // still studying; an open one always gets a new student, for one_open_loan_per_student.
      const settled = closedAt !== null || status === LoanStatus.cancelled || status === LoanStatus.rejected;
      const returning = pastBorrowers.filter((past) => academicYear(createdAt) - past.entryYear < 4);
      const student =
        settled && returning.length > 0 && rand.chance(0.35)
          ? rand.pick(returning)
          : newStudent(monthIndex * HISTORY_MAX_PER_MONTH + slot + 1, rand, createdAt);
      if (settled) pastBorrowers.push(student);
      loans.push({
        id: loanIdValue,
        ...student.borrower,
        advisorId,
        assignedAdminId: done >= 1 ? adminId : null,
        studentYear: Math.min(4, Math.max(1, academicYear(createdAt) - student.entryYear + 1)),
        amount,
        approvedAmount,
        purpose: rand.pick(PURPOSES),
        bankName: rand.pick(BANKS),
        bankAccountNo: `${rand.int(100, 999)}${rand.int(1_000_000, 9_999_999)}`,
        bankAccountName: student.name,
        installmentCount,
        firstDueDate: new Date((disbursedAt ?? createdAt + 7 * day) + 30 * day),
        status: closedAt !== null ? LoanStatus.closed : status,
        submittedAt: new Date(createdAt),
        cancelledAt: status === LoanStatus.cancelled ? new Date(abandoned ? stepTimes[stopStep] + rand.days(5, 20) : cancelAt) : null,
        disbursedAt: disbursedAt !== null ? new Date(disbursedAt) : null,
        // The borrower confirms receipt soon after the payout, well before any repayment.
        transferConfirmedAt: disbursedAt !== null ? new Date(Math.min(disbursedAt + 2 * hour, cutoff)) : null,
        closedAt: closedAt !== null ? new Date(closedAt) : null,
        createdAt: new Date(createdAt),
      });
    });
  }

  // Round top-ups at the start of each month with payouts, then one reconciliation row, so the
  // history's net is exactly what its open requests reserve.
  let topUps = 0;
  for (const [payoutMonth, payouts] of [...payoutsByMonth].sort()) {
    const amount = Math.ceil(payouts / 5000) * 5000;
    topUps += amount;
    ledger.unshift({
      kind: "top_up",
      amount,
      direction: 1,
      performedBy: id(2),
      note: `${HISTORY_NOTE_PREFIX} fund ${payoutMonth}`,
      createdAt: new Date(`${payoutMonth}-01T02:00:00Z`),
    });
  }
  const reconcile = reserved - (topUps + net);
  if (reconcile !== 0) {
    ledger.push({
      kind: reconcile > 0 ? "top_up" : "withdrawal",
      amount: Math.abs(reconcile),
      direction: reconcile > 0 ? 1 : -1,
      performedBy: id(2),
      note: `${HISTORY_NOTE_PREFIX} reconciliation`,
      createdAt: new Date(cutoff),
    });
  }

  return { loans, approvals, installments, payments, ledger };
}

// Seed-made staff have incrementing ids (00000000-0000-0000-0000-…); real staff get random uuids.
// Seed-made borrowers have emails no real CMU account takes: first.last@cmu.ac.th (fixtures, the
// dev-bypass student among them) or @example.com (history). Before each seed, delete every loan a
// seed-made borrower owns, with its approvals, installments, payments, ledger rows, audit rows and
// outbox rows, plus the seed's own non-loan ledger rows (notes starting "mock"), then every
// seed-made user nothing real points at. Staff 1-9 survive (upserted below): real dev loans
// reference them, since the dev bypass acts as them. Real users and everything they did are left
// alone.
async function wipeMockData(tx: Prisma.TransactionClient) {
  await tx.$executeRaw`SET LOCAL methang.allow_fund_mutation = 'on'`;
  await tx.$executeRaw`
    CREATE TEMP TABLE mock_loan ON COMMIT DROP AS
      SELECT id FROM loan_request
      WHERE student_email LIKE '%@example.com' OR student_email ~ '^[a-z]+[.][a-z]+@cmu[.]ac[.]th$'`;
  await tx.$executeRaw`
    CREATE TEMP TABLE mock_payment ON COMMIT DROP AS
      SELECT id FROM payment WHERE loan_id IN (SELECT id FROM mock_loan)`;
  await tx.$executeRaw`
    DELETE FROM fund_transaction
    WHERE loan_id IN (SELECT id FROM mock_loan)
       OR payment_id IN (SELECT id FROM mock_payment)
       OR (loan_id IS NULL AND payment_id IS NULL AND note LIKE 'mock%')`;
  await tx.$executeRaw`
    DELETE FROM audit_log
    WHERE entity_id IN (SELECT id FROM mock_loan) OR entity_id IN (SELECT id::text FROM mock_payment)`;
  await tx.$executeRaw`
    DELETE FROM notification_outbox o
    WHERE EXISTS (SELECT 1 FROM mock_loan m WHERE o.dedupe_key LIKE '%' || m.id || '%')`;
  await tx.$executeRaw`DELETE FROM payment WHERE id IN (SELECT id FROM mock_payment)`;
  // loan_approval and installment cascade.
  await tx.$executeRaw`DELETE FROM loan_request WHERE id IN (SELECT id FROM mock_loan)`;

  const staffIds = staff.map((user) => user.id as string);
  await tx.$executeRaw`
    CREATE TEMP TABLE mock_user ON COMMIT DROP AS
      SELECT u.id FROM app_user u
      WHERE u.id::text LIKE '00000000-0000-0000-0000-%'
        AND u.id::text <> ALL (${staffIds}::text[])
        AND NOT EXISTS (SELECT 1 FROM loan_request l
          WHERE u.id IN (l.advisor_id, l.assigned_admin_id))
        AND NOT EXISTS (SELECT 1 FROM loan_approval a WHERE a.decided_by = u.id)
        AND NOT EXISTS (SELECT 1 FROM payment p WHERE p.confirmed_by = u.id)
        AND NOT EXISTS (SELECT 1 FROM fund_transaction f WHERE f.performed_by = u.id)`;
  await tx.$executeRaw`DELETE FROM audit_log WHERE actor_id IN (SELECT id FROM mock_user)`;
  await tx.$executeRaw`UPDATE user_role SET granted_by = NULL WHERE granted_by IN (SELECT id FROM mock_user)`;
  // user_role cascades; system_setting.updated_by_id is ON DELETE SET NULL.
  await tx.$executeRaw`DELETE FROM app_user WHERE id IN (SELECT id FROM mock_user)`;
}

async function main() {
  await prisma.$transaction(
    async (tx) => {
      // audit_log is append-only; the seed deletes its own rows (and every row on --reset).
      await tx.$executeRaw`SET LOCAL methang.allow_audit_mutation = 'on'`;
      if (reset) {
        // Children before parents: fund_transaction references payment, so it must go first.
        await tx.$executeRaw`SET LOCAL methang.allow_fund_mutation = 'on'`;
        await tx.fundTransaction.deleteMany();
        await tx.payment.deleteMany();
        await tx.installment.deleteMany();
        await tx.loanApproval.deleteMany();
        await tx.auditLog.deleteMany();
        await tx.userRole.deleteMany();
        await tx.loanRequest.deleteMany();
        await tx.notificationOutbox.deleteMany();
        // system_setting.updated_by_id is ON DELETE SET NULL, so the singleton row survives.
        await tx.appUser.deleteMany();
      } else {
        await wipeMockData(tx);
      }

      // Upsert, not skipDuplicates: a re-seed also refreshes renamed fixture people.
      for (const user of users) {
        const { id: userId, ...fields } = user;
        await tx.appUser.upsert({ where: { id: userId }, create: user, update: fields });
      }

      // The system_setting migration seeds this row too, but db:reset's TRUNCATE ... CASCADE
      // (db/clear.ts) wipes it along with app_user, since it holds a FK to app_user. Restore it
      // here so a reset doesn't leave every settings endpoint 500ing. Same values as the
      // migration's seed INSERT - keep both in sync if the fixture values ever change.
      await tx.systemSetting.upsert({
        where: { id: 1 },
        update: {},
        create: {
          bankName: "ธนาคารกรุงไทย",
          accountName: "คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่ (เงินกู้ยืมฉุกเฉิน)",
          accountNumber: "521-0-12345-6",
          contactLocationTh: "จุดรับเอกสารคำร้องเงินกู้ยืม ชั้น 1 อาคารเทพรัตน์ คณะพยาบาลศาสตร์ มช.",
          contactPhone: "053-935025",
          contactExt: "5025, 5026",
          contactEmail: "loan@nurse.cmu.ac.th",
        },
      });

      await tx.userRole.createMany({ data: roles, skipDuplicates: true });
      await tx.loanRequest.createMany({ data: loans, skipDuplicates: true });
      await tx.$queryRaw`
        SELECT setval(
          'public.loan_request_number_seq',
          GREATEST(
            (SELECT last_value FROM public.loan_request_number_seq),
            -- Fixture ids only: the history ids end in 9NNN and must not push the sequence up.
            (SELECT COALESCE(MAX(right(id, 4)::integer), 0) FROM public.loan_request
              WHERE id LIKE 'REQ20260906%')
          ),
          true
        )
      `;
      await tx.loanApproval.createMany({ data: approvals, skipDuplicates: true });
      await tx.installment.createMany({ data: installments, skipDuplicates: true });

      const createdInstallments = await tx.installment.findMany({
        where: { loanId: { in: [loanId(207), loanId(208)] } },
        select: { id: true, loanId: true, seq: true },
      });
      const installmentId = (loanNumber: number, seq: number) => {
        const installment = createdInstallments.find(
          (row) => row.loanId === loanId(loanNumber) && row.seq === seq,
        );
        if (!installment) throw new Error(`Missing installment ${loanNumber}/${seq}`);
        return installment.id;
      };

      const paymentRows = [
        [301, 208, 1, 1000, "confirmed"],
        [302, 208, 2, 1000, "confirmed"],
        [303, 208, 3, 1000, "confirmed"],
        [304, 207, 1, 500, "pending_review"],
        [305, 207, 1, 1500, "rejected"],
      ] as const;
      const payments: Prisma.PaymentCreateManyInput[] = paymentRows.map(
        ([number, loanNumber, seq, amount, status]) => ({
          id: id(number),
          loanId: loanId(loanNumber),
          installmentId: installmentId(loanNumber, seq),
          amount,
          slipPath: `/mock/slips/${number}.jpg`,
          slipRef: `MOCK-SLIP-${number}`,
          status,
          confirmedBy: status === "pending_review" ? null : id(3),
          confirmedAt: status === "pending_review" ? null : dateFromNow(-2),
          paidAt: dateFromNow(-3),
        }),
      );

      await tx.payment.createMany({ data: payments, skipDuplicates: true });

      const fundNotes = [
        "mock initial fund",
        "mock disbursement 207",
        "mock disbursement 208",
        "confirmed MOCK-SLIP-301",
        "confirmed MOCK-SLIP-302",
        "confirmed MOCK-SLIP-303",
        "mock reconciliation adjustment",
      ];
      await tx.fundTransaction.createMany({
        data: [
          {
            kind: "top_up",
            amount: 100000,
            direction: 1,
            performedBy: id(2),
            note: fundNotes[0],
          },
          {
            kind: "disbursement",
            amount: 4500,
            direction: -1,
            loanId: loanId(207),
            performedBy: id(3),
            slipPath: "/mock/slips/disbursement-207.jpg",
            note: fundNotes[1],
          },
          {
            kind: "disbursement",
            amount: 3000,
            direction: -1,
            loanId: loanId(208),
            performedBy: id(3),
            slipPath: "/mock/slips/disbursement-208.jpg",
            note: fundNotes[2],
          },
          ...[301, 302, 303].map((number, index) => ({
            kind: "repayment" as const,
            amount: 1000,
            direction: 1,
            loanId: loanId(208),
            // Without this the seeded ledger has the one shape the app can never produce: a
            // repayment the one-repayment-per-payment index cannot see.
            paymentId: id(number),
            performedBy: id(3),
            note: fundNotes[index + 3],
          })),
          {
            kind: "credit_adjustment",
            amount: 250,
            direction: 1,
            performedBy: id(2),
            note: fundNotes[6],
          },
        ],
      });

      const history = buildHistory();
      const newLoanIds = history.loans.map((loan) => loan.id as string);
      await tx.loanRequest.createMany({ data: history.loans });
      await tx.loanApproval.createMany({ data: history.approvals });
      await tx.installment.createMany({ data: history.installments });
      const historyInstallments = await tx.installment.findMany({
        where: { loanId: { in: newLoanIds } },
        select: { id: true, loanId: true, seq: true },
      });
      const historyInstallmentId = new Map(
        historyInstallments.map((row) => [`${row.loanId}/${row.seq}`, row.id]),
      );
      await tx.payment.createMany({
        data: history.payments.map(({ seq, ...payment }) => ({
          ...payment,
          installmentId: historyInstallmentId.get(`${payment.loanId}/${seq}`),
        })),
      });
      await tx.fundTransaction.createMany({ data: history.ledger });

      const auditEntityIds = [loanId(205), loanId(206), loanId(207), id(301), "main"];
      await tx.auditLog.deleteMany({ where: { entityId: { in: auditEntityIds } } });
      await tx.auditLog.createMany({
        data: [
          {
            actorId: id(3),
            action: "approve_amount",
            entityType: "loan_request",
            entityId: loanId(205),
            before: { approved_amount: null },
            after: { approved_amount: 3200 },
          },
          {
            actorId: id(1),
            action: "approve",
            entityType: "loan_request",
            entityId: loanId(206),
            before: { status: "pending_executive" },
            after: { status: "pending_disbursement" },
          },
          {
            actorId: id(3),
            action: "disburse",
            entityType: "loan_request",
            entityId: loanId(207),
            before: { status: "pending_disbursement" },
            after: { status: "disbursed" },
          },
          {
            actorId: id(3),
            action: "confirm_payment",
            entityType: "payment",
            entityId: id(301),
            before: { status: "pending_review" },
            after: { status: "confirmed" },
          },
          {
            actorId: id(2),
            action: "adjust_fund",
            entityType: "fund",
            entityId: "main",
            after: { amount: 250, direction: 1 },
          },
        ],
      });
    },
    // Remote Supabase: every query pays a round trip, and the wipe + ~1000 ledger rows (each re-summed
    // by the balance trigger) ran past 30s. Rolls back whole on timeout, so a slow run changes nothing.
    { maxWait: 30_000, timeout: 180_000 },
  );

  console.log(reset ? "Development data reset and seeded." : "Development data seeded.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
