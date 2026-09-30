import type { UserRoleName } from "@/lib/generated/prisma/client";

// Admin, super_admin, and executive all review money movement end to end, so all three can read
// any student's repayment slip; a student can only read their own (a student's actorId is their
// student code). An advisor reads the repayment slips of the loans they advise: their students
// page shows each student's payment evidence history.
export function canReadRepaymentSlip(
  actorRole: UserRoleName,
  actorId: string,
  payment: { loan: { studentCode: string; advisorId: string } },
): boolean {
  if (actorRole === "admin" || actorRole === "super_admin" || actorRole === "executive") {
    return true;
  }
  if (actorRole === "student") return actorId === payment.loan.studentCode;
  if (actorRole === "advisor") return actorId === payment.loan.advisorId;
  return false;
}

// Same access set as repayment slips: admin/super_admin/executive can read any disbursement
// slip (not just the admin's own upload), and a student can read the disbursement slip for
// their own loan. Advisors never: they see repayments, not the payout.
export function canReadDisbursementSlip(
  actorRole: UserRoleName,
  actorId: string,
  fundTransaction: { loan: { studentCode: string } | null },
): boolean {
  if (actorRole === "admin" || actorRole === "super_admin" || actorRole === "executive") {
    return true;
  }
  if (actorRole === "student") return actorId === fundTransaction.loan?.studentCode;
  return false;
}
