import assert from "node:assert/strict";
import { after, test } from "node:test";

// Removing the advisor role on the real database: the advisor's pending_advisor loans are
// cancelled with their pending approval closed, and loans past the advisor step stay. Uses its own
// advisor and borrowers, so the seeded fixtures Bruno relies on are left alone.

if (!process.env.DATABASE_URL) throw new Error("advisor-removal needs DATABASE_URL; run it via npm run api:test");

const SUPER_ADMIN = "00000000-0000-0000-0000-000000000002";

// Loaded inside the test: tsx compiles this file to CJS, which has no top-level await.
const load = async () => ({
  ...(await import("../../lib/prisma")),
  ...(await import("../../db/queries/users")),
});

after(async () => (await import("../../lib/prisma")).prisma.$disconnect());

test("removing an advisor cancels only their pending_advisor loans", async () => {
  const { prisma, ADVISOR_REMOVED_COMMENT, mutateUserRole } = await load();
  const advisor = await prisma.appUser.create({
    data: { email: "leaving.advisor@cmu.ac.th", cmuAccount: "leaving.advisor", fullNameTh: "อาจารย์ ลาออก" },
  });
  await prisma.userRole.create({ data: { userId: advisor.id, role: "advisor", grantedBy: SUPER_ADMIN } });

  const loan = (studentCode: string, status: "pending_advisor" | "pending_admin") =>
    prisma.loanRequest.create({
      data: {
        studentCode,
        studentNameTh: "นักศึกษา ทดสอบ",
        studentEmail: `${studentCode}@cmu.ac.th`,
        advisorId: advisor.id,
        amount: 1000,
        studentYear: 2,
        purpose: "ทดสอบ",
        bankName: "ธนาคารกรุงไทย",
        bankAccountNo: "1234567890",
        bankAccountName: "นักศึกษา ทดสอบ",
        installmentCount: 1,
        firstDueDate: new Date("2026-11-01"),
        status,
        submittedAt: new Date(),
        approvals: { create: { step: status === "pending_advisor" ? "advisor" : "admin" } },
      },
    });
  const waiting = await loan("990000001", "pending_advisor");
  const passed = await loan("990000002", "pending_admin");

  await mutateUserRole({ actorId: SUPER_ADMIN, targetUserId: advisor.id, action: "remove", role: "advisor" });

  const [waitingAfter, passedAfter] = await Promise.all(
    [waiting.id, passed.id].map((id) =>
      prisma.loanRequest.findUniqueOrThrow({ where: { id }, include: { approvals: true } }),
    ),
  );

  assert.equal(waitingAfter.status, "cancelled");
  assert.ok(waitingAfter.cancelledAt);
  const [closed] = waitingAfter.approvals;
  assert.equal(closed.decision, "rejected");
  assert.equal(closed.decidedBy, SUPER_ADMIN);
  assert.equal(closed.comment, ADVISOR_REMOVED_COMMENT);

  // Past the advisor step: nothing sends it back to the advisor, so it carries on.
  assert.equal(passedAfter.status, "pending_admin");
  assert.equal(passedAfter.approvals[0].decision, "pending");

  const audit = await prisma.auditLog.findMany({
    where: { action: "loan_request.cancelled", entityId: { in: [waiting.id, passed.id] } },
  });
  assert.deepEqual(audit.map((row) => row.entityId), [waiting.id]);
  assert.equal(audit[0].actorId, SUPER_ADMIN);
});
