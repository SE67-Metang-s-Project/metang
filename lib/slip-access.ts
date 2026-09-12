import type { UserRoleName } from "@/lib/generated/prisma/client";

// Admin, super_admin, and executive all review money movement end to end, so all three can read
// any student's repayment slip; a student can only read their own. Advisors never handle banking
// evidence.
export function canReadRepaymentSlip(
  actorRole: UserRoleName,
  actorId: string,
  payment: { loan: { studentId: string } },
): boolean {
  if (actorRole === "admin" || actorRole === "super_admin" || actorRole === "executive") {
    return true;
  }
  if (actorRole === "student") return actorId === payment.loan.studentId;
  return false;
}

// Same access set as repayment slips: admin/super_admin/executive can read any disbursement
// slip (not just the admin's own upload), and a student can read the disbursement slip for
// their own loan. Advisors never.
export function canReadDisbursementSlip(
  actorRole: UserRoleName,
  actorId: string,
  fundTransaction: { loan: { studentId: string } | null },
): boolean {
  if (actorRole === "admin" || actorRole === "super_admin" || actorRole === "executive") {
    return true;
  }
  if (actorRole === "student") return actorId === fundTransaction.loan?.studentId;
  return false;
}
