import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canAccessLoanPetition,
  shouldHideBankDetailsForRole,
  sanitizeLoanPetitionForRole,
} from "../lib/loan-petition-access";
import type { ActionRequest } from "../components/shared/pending/RequestsCard";

const STUDENT_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_STUDENT_ID = "22222222-2222-2222-2222-222222222222";
const ADVISOR_ID = "33333333-3333-3333-3333-333333333333";
const OTHER_ADVISOR_ID = "44444444-4444-4444-4444-444444444444";
const EXECUTIVE_ID = "55555555-5555-5555-5555-555555555555";
const ADMIN_ID = "66666666-6666-6666-6666-666666666666";

test("Student: can access own loan only with full bank data", () => {
  const ownLoan = {
    studentId: STUDENT_ID,
    advisorId: ADVISOR_ID,
    status: "pending_advisor",
  };

  const ownAccess = canAccessLoanPetition({
    actorRole: "student",
    actorId: STUDENT_ID,
    loan: ownLoan,
  });
  assert.equal(ownAccess.allowed, true);
  assert.equal(ownAccess.includeBankData, true);

  const otherAccess = canAccessLoanPetition({
    actorRole: "student",
    actorId: OTHER_STUDENT_ID,
    loan: ownLoan,
  });
  assert.equal(otherAccess.allowed, false);
  assert.equal(otherAccess.includeBankData, false);
});

test("Advisor: can access assigned loans only, without bank data", () => {
  const assignedLoan = {
    studentId: STUDENT_ID,
    advisorId: ADVISOR_ID,
    status: "pending_advisor",
  };

  const assignedAccess = canAccessLoanPetition({
    actorRole: "advisor",
    actorId: ADVISOR_ID,
    loan: assignedLoan,
  });
  assert.equal(assignedAccess.allowed, true);
  assert.equal(assignedAccess.includeBankData, false);

  const unassignedAccess = canAccessLoanPetition({
    actorRole: "advisor",
    actorId: OTHER_ADVISOR_ID,
    loan: assignedLoan,
  });
  assert.equal(unassignedAccess.allowed, false);
  assert.equal(unassignedAccess.includeBankData, false);
});

test("Executive: can access authorized loans, without bank data", () => {
  const submittedLoan = {
    studentId: STUDENT_ID,
    advisorId: ADVISOR_ID,
    status: "pending_executive",
  };
  const draftLoan = {
    studentId: STUDENT_ID,
    advisorId: ADVISOR_ID,
    status: "draft",
  };

  const authorizedAccess = canAccessLoanPetition({
    actorRole: "executive",
    actorId: EXECUTIVE_ID,
    loan: submittedLoan,
  });
  assert.equal(authorizedAccess.allowed, true);
  assert.equal(authorizedAccess.includeBankData, false);

  const draftAccess = canAccessLoanPetition({
    actorRole: "executive",
    actorId: EXECUTIVE_ID,
    loan: draftLoan,
  });
  assert.equal(draftAccess.allowed, false);
  assert.equal(draftAccess.includeBankData, false);
});

test("Admin/SuperAdmin: can access authorized loans with full financial and bank data", () => {
  const loan = {
    studentId: STUDENT_ID,
    advisorId: ADVISOR_ID,
    status: "pending_admin",
  };

  const adminAccess = canAccessLoanPetition({
    actorRole: "admin",
    actorId: ADMIN_ID,
    loan,
  });
  assert.equal(adminAccess.allowed, true);
  assert.equal(adminAccess.includeBankData, true);

  const superAdminAccess = canAccessLoanPetition({
    actorRole: "super_admin",
    actorId: ADMIN_ID,
    loan,
  });
  assert.equal(superAdminAccess.allowed, true);
  assert.equal(superAdminAccess.includeBankData, true);
});

test("shouldHideBankDetailsForRole correctly hides bank data for advisor and executive", () => {
  assert.equal(shouldHideBankDetailsForRole("advisor"), true);
  assert.equal(shouldHideBankDetailsForRole("executive"), true);
  assert.equal(shouldHideBankDetailsForRole("admin"), false);
  assert.equal(shouldHideBankDetailsForRole("super_admin"), false);
  assert.equal(shouldHideBankDetailsForRole("student"), false);
});

test("sanitizeLoanPetitionForRole strips bankDetails for advisor and executive", () => {
  const req = {
    id: "REQ-001",
    name: "สมศรี พยาบาล",
    studentId: "6501234567",
    major: "พยาบาลศาสตร์",
    year: "3",
    amount: "5000",
    term: "2",
    objective: "ค่าเล่าเรียน",
    submitDate: "14 ก.ย. 2569",
    requestStatus: "pending_advisor",
    bankDetails: {
      bankName: "ไทยพาณิชย์",
      accountNumber: "123-4-56789-0",
      accountName: "สมศรี พยาบาล",
    },
  } as unknown as ActionRequest;

  const sanitizedAdvisor = sanitizeLoanPetitionForRole(req, "advisor");
  assert.equal(sanitizedAdvisor.bankDetails, undefined);

  const sanitizedExecutive = sanitizeLoanPetitionForRole(req, "executive");
  assert.equal(sanitizedExecutive.bankDetails, undefined);

  const sanitizedAdmin = sanitizeLoanPetitionForRole(req, "admin");
  assert.ok(sanitizedAdmin.bankDetails);
  assert.equal(sanitizedAdmin.bankDetails.accountNumber, "123-4-56789-0");

  const sanitizedStudent = sanitizeLoanPetitionForRole(req, "student");
  assert.ok(sanitizedStudent.bankDetails);
});
