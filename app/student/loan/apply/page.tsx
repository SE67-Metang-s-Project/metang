import { Suspense } from "react";
import TempLoanApplicationPage from "@/components/student/application/TempLoanApplicationPage";
import { requireStudentAccess } from "@/lib/loan-auth";
import { getStudentCurrentLoan } from "@/db/queries/loan-requests";
import { getStudentLoanLimit } from "@/db/queries/fund-transactions";
import { normalizeBankName } from "@/lib/bank-name";
import { listAdvisors } from "@/db/queries/users";
import type { StudentProfileDisplay } from "@/components/student/dashboard/LoanSummaryCard";

export const dynamic = "force-dynamic";

export default async function StudentLoanApplyPage() {
  const context = await requireStudentAccess();
  const studentId = context.user.id;

  const [currentLoan, advisors, studentLoanLimit] = await Promise.all([
    getStudentCurrentLoan(studentId).catch((err) => {
      console.error("Failed to check existing loan", err);
      return null;
    }),
    listAdvisors().catch((err) => {
      console.error("Failed to load advisors", err);
      return [];
    }),
    getStudentLoanLimit(studentId).catch((err) => {
      console.error("Failed to load student loan limit", err);
      return 0;
    }),
  ]);

  const profile: StudentProfileDisplay & { phoneNumber?: string } = {
    displayName: context.user.fullNameTh || context.identity.displayName || "นักศึกษา",
    displayNameEn: context.user.fullNameEn ?? undefined,
    studentId: context.user.studentCode || context.identity.studentCode || "",
    educationLevel: context.user.educationLevel ?? undefined,
    programName: "พยาบาลศาสตรบัณฑิต",
    contactEmail: context.user.email || `${context.user.studentCode}@cmu.ac.th`,
    phoneNumber: context.user.phone ?? undefined,
  };

  const advisorOptions = advisors
    .filter((advisor): advisor is typeof advisor & { fullNameTh: string } => Boolean(advisor.fullNameTh))
    .map((advisor) => ({ name: advisor.fullNameTh, nameEn: advisor.fullNameEn ?? undefined }));

  let existingLoan = null;
  if (currentLoan) {
    const returnApproval = (currentLoan.approvals || [])
      .slice()
      .reverse()
      .find((a: { decision?: string }) => a.decision === "returned");

    existingLoan = {
      id: currentLoan.id,
      status: currentLoan.status,
      amount: currentLoan.amount,
      studentYear: currentLoan.studentYear,
      purpose: currentLoan.purpose,
      additionalNote: currentLoan.additionalNote,
      bankName: normalizeBankName(currentLoan.bankName),
      bankAccountNo: currentLoan.bankAccountNo,
      bankAccountName: currentLoan.bankAccountName,
      installmentCount: currentLoan.installmentCount,
      advisorName: currentLoan.advisor?.fullNameTh ?? undefined,
      returnComment: returnApproval?.comment ?? undefined,
      returnStep: returnApproval?.step ?? undefined,
    };
  }

  return (
    <Suspense fallback={null}>
      <TempLoanApplicationPage
        advisorOptions={advisorOptions.length > 0 ? advisorOptions : undefined}
        existingLoan={existingLoan}
        loanLimit={studentLoanLimit}
        profile={profile}
      />
    </Suspense>
  );
}
