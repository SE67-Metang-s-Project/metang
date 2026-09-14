import type { UserRoleName } from "@/lib/generated/prisma/client";
import type { ActionRequest, UserRole } from "@/components/shared/pending/RequestsCard";

export type LoanPetitionActorRole = UserRoleName | "super_admin";

export interface LoanPetitionAccessDecision {
  allowed: boolean;
  includeBankData: boolean;
  reason?: string;
}

/**
 * Access policy for viewing and downloading loan petition (PDF):
 * - Student: own loan only (includes student's own bank data).
 * - Advisor: assigned loans only, without bank data.
 * - Executive: authorized loans (non-draft), without bank data.
 * - Admin/SuperAdmin: authorized full financial and bank data.
 */
export function canAccessLoanPetition({
  actorRole,
  actorId,
  loan,
}: {
  actorRole: LoanPetitionActorRole;
  actorId: string;
  loan: {
    studentId: string;
    advisorId?: string | null;
    status?: string | null;
  };
}): LoanPetitionAccessDecision {
  switch (actorRole) {
    case "student":
      if (loan.studentId === actorId) {
        return { allowed: true, includeBankData: true };
      }
      return {
        allowed: false,
        includeBankData: false,
        reason: "Students can only access and download their own loan petition",
      };

    case "advisor":
      if (loan.advisorId === actorId) {
        return { allowed: true, includeBankData: false };
      }
      return {
        allowed: false,
        includeBankData: false,
        reason: "Advisors can only access and download loans assigned to them",
      };

    case "executive":
      // Executive reviews authorized non-draft loans
      if (loan.status && loan.status !== "draft") {
        return { allowed: true, includeBankData: false };
      }
      return {
        allowed: false,
        includeBankData: false,
        reason: "Executives can only access authorized submitted loans",
      };

    case "admin":
    case "super_admin":
      return { allowed: true, includeBankData: true };

    default:
      return { allowed: false, includeBankData: false, reason: "Unauthorized role" };
  }
}

/**
 * Determines whether bank data should be stripped / hidden on the loan petition form for a role.
 * Advisors and Executives must not view bank data.
 * Students (their own loan), Admin, and SuperAdmin view bank data.
 */
export function shouldHideBankDetailsForRole(role?: UserRole | "student" | string): boolean {
  if (role === "advisor" || role === "executive") {
    return true;
  }
  return false;
}

/**
 * Sanitizes an ActionRequest by removing bankDetails if the role is not permitted to see bank data.
 */
export function sanitizeLoanPetitionForRole(
  request: ActionRequest,
  role?: UserRole | "student" | string,
): ActionRequest {
  if (shouldHideBankDetailsForRole(role)) {
    const sanitized = { ...request };
    delete (sanitized as { bankDetails?: unknown }).bankDetails;
    return sanitized;
  }
  return request;
}
