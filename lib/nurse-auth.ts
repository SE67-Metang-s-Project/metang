import "server-only";

import type { CmuProfile } from "@/lib/cmu-auth";

export const NURSING_ORGANIZATION_CODE = "12";
export const NURSING_STUDENT_ID_PATTERN = /^\d{2}1210\d{3}$/;

export type NurseAccessDecision =
  | { allowed: true; userType: "student" | "employee" }
  | {
      allowed: false;
      userType: "student" | "employee" | "unknown";
      reason: "student_id_not_eligible" | "employee_not_nursing" | "profile_not_eligible";
    };

function getProfileText(profile: CmuProfile, key: string) {
  const value = profile[key];

  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }

  return "";
}

export function isEligibleNursingStudentId(studentId: string) {
  return NURSING_STUDENT_ID_PATTERN.test(studentId.trim());
}

export function isNursingFacultyEmployee(profile: CmuProfile) {
  return getProfileText(profile, "organization_code") === NURSING_ORGANIZATION_CODE;
}

export function getNurseAccessDecision(profile: CmuProfile): NurseAccessDecision {
  const studentId = getProfileText(profile, "student_id");


  if (isNursingFacultyEmployee(profile)) {
    if (studentId) {
      return isEligibleNursingStudentId(studentId)
        ? { allowed: true, userType: "student" } : { allowed: false, userType: "student", reason: "student_id_not_eligible" };
    }
    return { allowed: true, userType: "employee" };
  }

  return {
    allowed: false,
    userType: "unknown",
    reason: "employee_not_nursing",
  };
}
