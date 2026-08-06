import { PrismaPg } from "@prisma/adapter-pg";
import {
  ApprovalStep,
  Decision,
  LoanStatus,
  Prisma,
  PrismaClient,
  UserRoleName,
} from "../lib/generated/prisma/client";

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

const users: Prisma.AppUserCreateManyInput[] = [
  {
    id: id(1),
    email: "exec@cmu.ac.th",
    fullNameTh: "ผู้บริหาร ทดสอบ",
    fullNameEn: "Mock Executive",
  },
  {
    id: id(2),
    email: "superadmin@cmu.ac.th",
    fullNameTh: "ซุปเปอร์แอดมิน ทดสอบ",
    fullNameEn: "Mock Super Admin",
  },
  {
    id: id(3),
    email: "admin@cmu.ac.th",
    fullNameTh: "แอดมิน ทดสอบ",
    fullNameEn: "Mock Admin",
    phone: "0800000003",
  },
  {
    id: id(4),
    email: "advisor@cmu.ac.th",
    fullNameTh: "อาจารย์ที่ปรึกษา ทดสอบ",
    fullNameEn: "Mock Advisor",
    phone: "0800000004",
  },
  {
    id: id(5),
    email: "advisor2@cmu.ac.th",
    fullNameTh: "อาจารย์สำรอง ทดสอบ",
    fullNameEn: "Backup Advisor",
  },
  ...Array.from({ length: 11 }, (_, index) => {
    const number = index + 1;
    const userId = number + 100;

    return {
      id: id(userId),
      email: `student${number}@cmu.ac.th`,
      studentCode: `660610${String(number).padStart(3, "0")}`,
      fullNameTh: `นักศึกษา ทดสอบ ${number}`,
      fullNameEn: `Mock Student ${number}`,
      phone: [6, 9].includes(number) ? null : `0810000${String(userId).padStart(3, "0")}`,
    };
  }),
];

const roles: Prisma.UserRoleCreateManyInput[] = [
  { userId: id(1), role: UserRoleName.executive, grantedBy: id(2) },
  { userId: id(1), role: UserRoleName.advisor, grantedBy: id(2) },
  { userId: id(2), role: UserRoleName.super_admin },
  { userId: id(3), role: UserRoleName.admin, grantedBy: id(2) },
  { userId: id(4), role: UserRoleName.advisor, grantedBy: id(2) },
  { userId: id(5), role: UserRoleName.advisor, grantedBy: id(2) },
  ...Array.from({ length: 11 }, (_, index) => ({
    userId: id(index + 101),
    role: UserRoleName.student,
    grantedBy: id(2),
  })),
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

const loans: Prisma.LoanRequestCreateManyInput[] = loanScenarios.map(
  ([number, status, amount, approvedAmount, installmentCount, dueOffset]) => ({
    id: id(number),
    studentId: id(number - 100),
    advisorName: [208, 209].includes(number)
      ? "อาจารย์สำรอง ทดสอบ"
      : "อาจารย์ที่ปรึกษา ทดสอบ",
    amount,
    approvedAmount,
    purpose: `Mock scenario: ${status}`,
    bankName: "ธนาคารกรุงไทย",
    bankAccountNo: `1000000${number}`,
    bankAccountName: `นักศึกษา ทดสอบ ${number - 200}`,
    installmentCount,
    firstDueDate: dateFromNow(dueOffset),
    status,
    submittedAt: [201, 210].includes(number) ? null : dateFromNow(-7),
    cancelledAt: status === LoanStatus.cancelled ? dateFromNow(-1) : null,
    cancelledBy: number === 210 ? id(110) : number === 211 ? id(3) : null,
    disbursedAt:
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
    loanId: id(loanNumber),
    step,
    decision,
    decidedBy: actorNumber ? id(actorNumber) : null,
    decidedAt: actorNumber ? dateFromNow(-3) : null,
    comment,
  }),
);

const installments: Prisma.InstallmentCreateManyInput[] = [
  { loanId: id(207), seq: 1, dueDate: dateFromNow(-30), amountDue: 1500, amountPaid: 0 },
  { loanId: id(207), seq: 2, dueDate: dateFromNow(10), amountDue: 1500, amountPaid: 500 },
  { loanId: id(207), seq: 3, dueDate: dateFromNow(40), amountDue: 1500, amountPaid: 0 },
  {
    loanId: id(208),
    seq: 1,
    dueDate: dateFromNow(-90),
    amountDue: 1000,
    amountPaid: 1000,
    settledAt: dateFromNow(-92),
  },
  {
    loanId: id(208),
    seq: 2,
    dueDate: dateFromNow(-60),
    amountDue: 1000,
    amountPaid: 1000,
    settledAt: dateFromNow(-55),
  },
  {
    loanId: id(208),
    seq: 3,
    dueDate: dateFromNow(-30),
    amountDue: 1000,
    amountPaid: 1000,
    settledAt: dateFromNow(-30),
  },
];

async function main() {
  await prisma.$transaction(
    async (tx) => {
      if (reset) {
        await tx.payment.deleteMany();
        await tx.installment.deleteMany();
        await tx.loanApproval.deleteMany();
        await tx.fundTransaction.deleteMany();
        await tx.auditLog.deleteMany();
        await tx.userRole.deleteMany();
        await tx.loanRequest.deleteMany();
        await tx.appUser.deleteMany();
      }

      await tx.appUser.createMany({ data: users, skipDuplicates: true });
      await tx.userRole.createMany({ data: roles, skipDuplicates: true });
      await tx.loanRequest.createMany({ data: loans, skipDuplicates: true });
      await tx.loanApproval.createMany({ data: approvals, skipDuplicates: true });
      await tx.installment.createMany({ data: installments, skipDuplicates: true });

      const createdInstallments = await tx.installment.findMany({
        where: { loanId: { in: [id(207), id(208)] } },
        select: { id: true, loanId: true, seq: true },
      });
      const installmentId = (loanNumber: number, seq: number) => {
        const installment = createdInstallments.find(
          (row) => row.loanId === id(loanNumber) && row.seq === seq,
        );
        if (!installment) throw new Error(`Missing installment ${loanNumber}/${seq}`);
        return installment.id;
      };

      const paymentRows = [
        [301, 208, 1, 1000, "verified", "confirmed"],
        [302, 208, 2, 1000, "manual", "confirmed"],
        [303, 208, 3, 1000, "verified", "confirmed"],
        [304, 207, 2, 500, "pending", "pending_review"],
        [305, 207, 1, 1500, "failed", "rejected"],
      ] as const;
      const payments: Prisma.PaymentCreateManyInput[] = paymentRows.map(
        ([number, loanNumber, seq, amount, ocrState, status]) => ({
          id: id(number),
          loanId: id(loanNumber),
          installmentId: installmentId(loanNumber, seq),
          amount,
          slipUrl: `/mock/slips/${number}.jpg`,
          slipRef: `MOCK-SLIP-${number}`,
          slipOcrStatus: ocrState,
          ocrAmount: ocrState === "verified" ? amount : ocrState === "failed" ? 150 : null,
          ocrPaidAt: ocrState === "pending" ? null : dateFromNow(-3),
          slipOcrRaw:
            ocrState === "pending" ? undefined : { source: "mock", state: ocrState },
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
      await tx.fundTransaction.deleteMany({ where: { note: { in: fundNotes } } });
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
            kind: "disburse",
            amount: 4500,
            direction: -1,
            loanId: id(207),
            performedBy: id(3),
            slipUrl: "/mock/slips/disbursement-207.jpg",
            note: fundNotes[1],
          },
          {
            kind: "disburse",
            amount: 3000,
            direction: -1,
            loanId: id(208),
            performedBy: id(3),
            slipUrl: "/mock/slips/disbursement-208.jpg",
            note: fundNotes[2],
          },
          ...[301, 302, 303].map((number, index) => ({
            kind: "repayment",
            amount: 1000,
            direction: 1,
            loanId: id(208),
            performedBy: id(3),
            note: fundNotes[index + 3],
          })),
          {
            kind: "adjustment",
            amount: 250,
            direction: 1,
            performedBy: id(2),
            note: fundNotes[6],
          },
        ],
      });

      const auditEntityIds = [id(205), id(206), id(207), id(301), "main"];
      await tx.auditLog.deleteMany({ where: { entityId: { in: auditEntityIds } } });
      await tx.auditLog.createMany({
        data: [
          {
            actorId: id(3),
            action: "approve_amount",
            entityType: "loan_request",
            entityId: id(205),
            before: { approved_amount: null },
            after: { approved_amount: 3200 },
          },
          {
            actorId: id(1),
            action: "approve",
            entityType: "loan_request",
            entityId: id(206),
            before: { status: "pending_executive" },
            after: { status: "pending_disbursement" },
          },
          {
            actorId: id(3),
            action: "disburse",
            entityType: "loan_request",
            entityId: id(207),
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
    { maxWait: 30_000, timeout: 30_000 },
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
