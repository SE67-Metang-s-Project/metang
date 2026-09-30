import { PrismaPg } from "@prisma/adapter-pg";
import {
  ApprovalStep,
  Decision,
  LoanStatus,
  PrismaClient,
  UserRoleName,
} from "../lib/generated/prisma/client";

if (process.env.INFISICAL_ENV?.trim() !== "dev") {
  throw new Error("db:simple-workflow is only allowed with INFISICAL_ENV=dev");
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

// Keep these IDs below the regular fixtures so the development bypass selects this pair first.
const advisorId = "00000000-0000-0000-0000-000000000000";
// Students are not app_user rows: the loan carries its borrower.
const student = {
  studentCode: "SIMPLE001",
  studentNameTh: "นักศึกษาทดสอบ",
  studentNameEn: "Simple Workflow Student",
  studentEmail: "simple-student@cmu.ac.th",
  studentPhone: "0812345678",
};
const historyLoanId = "REQ202609060000";

async function main() {
  const now = new Date();
  const firstDueDate = new Date(now.getTime() + 30 * 86_400_000);

  await prisma.$transaction(
    async (tx) => {
      await tx.appUser.upsert({
        where: { id: advisorId },
        update: {
          email: "simple-advisor@cmu.ac.th",
          cmuAccount: "simple-advisor@cmu.ac.th",
          fullNameTh: "อาจารย์ทดสอบ",
          fullNameEn: "Simple Workflow Advisor",
          phone: "0801234567",
        },
        create: {
          id: advisorId,
          email: "simple-advisor@cmu.ac.th",
          cmuAccount: "simple-advisor@cmu.ac.th",
          fullNameTh: "อาจารย์ทดสอบ",
          fullNameEn: "Simple Workflow Advisor",
          phone: "0801234567",
        },
      });

      await tx.userRole.upsert({
        where: { userId_role: { userId: advisorId, role: UserRoleName.advisor } },
        update: {},
        create: { userId: advisorId, role: UserRoleName.advisor },
      });

      await tx.loanRequest.upsert({
        where: { id: historyLoanId },
        update: {
          ...student,
          advisorId,
          amount: 5000,
          approvedAmount: 5000,
          studentYear: 1,
          purpose: "Simple workflow history",
          bankName: "ธนาคารกรุงไทย",
          bankAccountNo: "1234567890",
          bankAccountName: "นักศึกษาทดสอบ",
          installmentCount: 1,
          firstDueDate,
          status: LoanStatus.closed,
          submittedAt: now,
          disbursedAt: now,
          closedAt: now,
        },
        create: {
          id: historyLoanId,
          ...student,
          advisorId,
          amount: 5000,
          approvedAmount: 5000,
          studentYear: 1,
          purpose: "Simple workflow history",
          bankName: "ธนาคารกรุงไทย",
          bankAccountNo: "1234567890",
          bankAccountName: "นักศึกษาทดสอบ",
          installmentCount: 1,
          firstDueDate,
          status: LoanStatus.closed,
          submittedAt: now,
          disbursedAt: now,
          closedAt: now,
        },
      });

      await tx.loanApproval.upsert({
        where: {
          loanId_step_attempt: {
            loanId: historyLoanId,
            step: ApprovalStep.advisor,
            attempt: 1,
          },
        },
        update: {
          decision: Decision.approved,
          decidedBy: advisorId,
          decidedAt: now,
          comment: null,
        },
        create: {
          loanId: historyLoanId,
          step: ApprovalStep.advisor,
          attempt: 1,
          decision: Decision.approved,
          decidedBy: advisorId,
          decidedAt: now,
        },
      });
    },
    { maxWait: 30_000, timeout: 30_000 },
  );

  console.log("Simple workflow seeded for local development.");
  console.log("Student: simple-student@cmu.ac.th");
  console.log("Advisor: simple-advisor@cmu.ac.th");
  console.log("advisorName for loan requests: อาจารย์ทดสอบ");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
