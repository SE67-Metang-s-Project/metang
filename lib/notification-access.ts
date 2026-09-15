import type { UserRoleName } from "@/lib/generated/prisma/client";

// The owning student and the assigned advisor may each trigger a reviewer notification on their
// own loan; admin/super_admin/executive may trigger one on any loan, matching the review access
// they already hold everywhere else in the app.
export function canTriggerReviewerNotification(
  actorRole: UserRoleName,
  actorId: string,
  loan: { studentId: string; advisorId: string },
): boolean {
  if (actorRole === "admin" || actorRole === "super_admin" || actorRole === "executive") {
    return true;
  }
  if (actorRole === "student") return actorId === loan.studentId;
  if (actorRole === "advisor") return actorId === loan.advisorId;
  return false;
}
