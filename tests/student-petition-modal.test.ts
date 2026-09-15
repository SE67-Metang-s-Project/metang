import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { mapStudentLoanToActionRequest } from "@/lib/student-action-request";
import { loanDetailsByRequestNumber, studentProfile } from "@/app/student/studentMockData";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

test("mapStudentLoanToActionRequest converts student loan details to ActionRequest for official petition form", () => {
  const details = loanDetailsByRequestNumber["SL-2568-0001"];
  assert.ok(details, "Mock loan details for SL-2568-0001 must exist");

  const actionRequest = mapStudentLoanToActionRequest(details, studentProfile);

  assert.equal(actionRequest.id, "SL-2568-0001");
  assert.equal(actionRequest.name, studentProfile.displayName);
  assert.equal(actionRequest.studentId, studentProfile.studentId);
  assert.equal(actionRequest.major, "พยาบาลศาสตร์");
  assert.equal(actionRequest.program, studentProfile.programName);
  assert.equal(actionRequest.amount, "3000");
  assert.equal(actionRequest.objective, details.purpose);
  assert.equal(actionRequest.additionalNote, details.additionalReason);
  assert.equal(actionRequest.term, "3");
  assert.ok(actionRequest.installments && actionRequest.installments.length === 3);
  assert.equal(actionRequest.installments[0].installmentNumber, 1);
  assert.equal(actionRequest.installments[0].amount, "1000");
  assert.equal(actionRequest.installments[0].isPaid, true);

  // Approvals should be extracted from timeline if not explicitly present
  assert.ok(actionRequest.approvals && actionRequest.approvals.length > 0);
  const advisor = actionRequest.approvals.find((a) => a.step === "advisor");
  assert.ok(advisor);
  assert.equal(advisor.actorName, "พิมพา มีโชค");
  assert.equal(advisor.decision, "approved");
});

test("LoanDetailsPage and LoanDetailOverview connect LoanPetitionModal to 'ดาวน์โหลดแบบคำร้อง (PDF)'", () => {
  const loanDetailsPageContent = read("components/student/loan-details/LoanDetailsPage.tsx");
  assert.match(
    loanDetailsPageContent,
    /LoanPetitionModal/,
    "LoanDetailsPage must import and render LoanPetitionModal",
  );
  assert.match(
    loanDetailsPageContent,
    /mapStudentLoanToActionRequest/,
    "LoanDetailsPage must use mapStudentLoanToActionRequest",
  );
  assert.match(
    loanDetailsPageContent,
    /onDownloadClick=\{.*setIsPetitionModalOpen\(true\)/,
    "LoanDetailsPage must pass onDownloadClick to open petition modal",
  );

  const loanDetailOverviewContent = read("components/student/loan-details/LoanDetailOverview.tsx");
  assert.match(
    loanDetailOverviewContent,
    /onClick=\{handleDownloadClick\}/,
    "LoanDetailOverview must trigger download click handler on button",
  );
  assert.match(
    loanDetailOverviewContent,
    /LoanPetitionModal/,
    "LoanDetailOverview must support rendering LoanPetitionModal",
  );

  const loanPetitionModalContent = read("components/shared/LoanPetitionModal.tsx");
  assert.match(
    loanPetitionModalContent,
    /แบบขอยืมเงินทุนสวัสดิการ/,
    "LoanPetitionModal header must display แบบขอยืมเงินทุนสวัสดิการ",
  );
  assert.match(
    loanPetitionModalContent,
    /LoanPetitionDocument/,
    "LoanPetitionModal must render LoanPetitionDocument",
  );
  assert.match(
    loanPetitionModalContent,
    /downloadLoanPetitionPdf/,
    "LoanPetitionModal must support downloading the PDF",
  );
});

test("Download petition PDF button appears only when admin/super admin has successfully transferred funds", () => {
  const loanDetailsPageContent = read("components/student/loan-details/LoanDetailsPage.tsx");
  assert.match(
    loanDetailsPageContent,
    /const shouldShowDownload = hasAdminTransferredFunds;/,
    "LoanDetailsPage must show download button only when admin has transferred funds",
  );

  const disburseDebtCardContent = read("components/shared/disburse-debt/DisburseDebtCard.tsx");
  assert.match(
    disburseDebtCardContent,
    /\{isCompleted && \(\s*<button[\s\S]*?ดาวน์โหลดแบบคำร้อง \(PDF\)[\s\S]*?<\/button>\s*\)\}/,
    "DisburseDebtCard must guard download button so it only appears when disbursement is completed",
  );

  const requestsCardContent = read("components/shared/pending/RequestsCard.tsx");
  assert.match(
    requestsCardContent,
    /\{isDisbursed && \(\s*<button[\s\S]*?ดาวน์โหลดแบบคำร้อง \(PDF\)[\s\S]*?<\/button>\s*\)\}/,
    "RequestsCard must guard download button so it only appears when disbursement is completed",
  );
});
