import assert from "node:assert/strict";
import { after, test } from "node:test";

// Admin cancel on the real database: a pending_admin loan assigned to another admin is theirs
// alone, as in decideAdminLoanRequest. Uses its own borrowers, so the seeded fixtures Bruno relies
// on are left alone.

if (!process.env.DATABASE_URL) throw new Error("admin-cancel-ownership needs DATABASE_URL; run it via npm run api:test");

const ADMIN = "00000000-0000-0000-0000-000000000003";
const OTHER_ADMIN = "00000000-0000-0000-0000-000000000009";
const ADVISOR = "00000000-0000-0000-0000-000000000004";

// Loaded inside the test: tsx compiles this file to CJS, which has no top-level await.
const load = async () => ({
  ...(await import("../../lib/prisma")),
  ...(await import("../../db/queries/loan-requests")),
});

after(async () => (await import("../../lib/prisma")).prisma.$disconnect());

test("an admin cannot cancel a pending_admin loan assigned to another admin", async () => {
  const { prisma, AdminCancelError, cancelAdminLoanRequest } = await load();
  const loan = (studentCode: string, assignedAdminId: string | null) =>
    prisma.loanRequest.create({
      data: {
        studentCode,
        studentNameTh: "นักศึกษา ทดสอบ",
        studentEmail: `${studentCode}@cmu.ac.th`,
        advisorId: ADVISOR,
        assignedAdminId,
        amount: 1000,
        studentYear: 2,
        purpose: "ทดสอบ",
        bankName: "ธนาคารกรุงไทย",
        bankAccountNo: "1234567890",
        bankAccountName: "นักศึกษา ทดสอบ",
        installmentCount: 1,
        firstDueDate: new Date("2026-11-01"),
        status: "pending_admin",
        submittedAt: new Date(),
        approvals: { create: { step: "admin" } },
      },
    });
  const theirs = await loan("990000011", OTHER_ADMIN);
  const unassigned = await loan("990000012", null);

  await assert.rejects(
    cancelAdminLoanRequest({ id: theirs.id, adminId: ADMIN, comment: "ทดสอบ" }),
    (error) => error instanceof AdminCancelError && error.code === "NOT_FOUND",
  );
  const theirsAfter = await prisma.loanRequest.findUniqueOrThrow({
    where: { id: theirs.id },
    include: { approvals: true },
  });
  assert.equal(theirsAfter.status, "pending_admin");
  assert.equal(theirsAfter.approvals[0].decision, "pending");

  // The assigned admin, and anyone on an unassigned loan, still can.
  await cancelAdminLoanRequest({ id: theirs.id, adminId: OTHER_ADMIN, comment: "ทดสอบ" });
  await cancelAdminLoanRequest({ id: unassigned.id, adminId: ADMIN, comment: "ทดสอบ" });
  const statuses = await prisma.loanRequest.findMany({
    where: { id: { in: [theirs.id, unassigned.id] } },
    select: { status: true },
  });
  assert.deepEqual(statuses.map((row) => row.status), ["cancelled", "cancelled"]);
});
