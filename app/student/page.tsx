import StudentDashboard from "@/components/student/dashboard/StudentDashboard";
import { requireStudentAccess } from "@/lib/loan-auth";
import { getStudentCurrentLoan, getStudentLoanList } from "@/db/queries/loan-requests";
import {
  computePaymentBehavior,
  mapToActiveLoanSummary,
  mapToInstallmentPayments,
  mapToLoanDetails,
  mapToLoanRequestHistoryItem,
  type RawStudentLoan,
} from "@/lib/student-view-model";

export const dynamic = "force-dynamic";

export default async function StudentPage() {
  const context = await requireStudentAccess();
  const studentId = context.user.id;

  const [currentLoanRaw, loanListRaw] = await Promise.all([
    getStudentCurrentLoan(studentId).catch((err) => {
      console.error("Unable to load student current loan", err);
      return null;
    }),
    getStudentLoanList(studentId).catch((err) => {
      console.error("Unable to load student loan history", err);
      return [];
    }),
  ]);

  const currentLoan = currentLoanRaw as RawStudentLoan | null;
  const loanList = (loanListRaw || []) as RawStudentLoan[];

  const initialProfile = {
    displayName: context.user.fullNameTh || context.identity.displayName || "นักศึกษา",
    studentId: context.user.studentCode || context.identity.studentCode || "",
    educationLevel: context.user.educationLevel ?? undefined,
    programName: "พยาบาลศาสตรบัณฑิต",
    contactEmail: context.user.email || `${context.user.studentCode}@cmu.ac.th`,
  };

  const initialActiveLoan = mapToActiveLoanSummary(currentLoan);
  const initialHistoryRequests = loanList.map(mapToLoanRequestHistoryItem);
  const initialInstallments = currentLoan?.installments
    ? mapToInstallmentPayments(currentLoan.installments)
    : undefined;
  const initialPaymentBehavior = computePaymentBehavior(loanList);
  const currentDetails = currentLoan ? mapToLoanDetails(currentLoan) : null;
  const initialTimeline = currentDetails?.timeline ?? [];
  const initialSchedule = currentDetails?.schedule ?? [];

  return (
    <StudentDashboard
      initialActiveLoan={initialActiveLoan}
      initialHistoryRequests={initialHistoryRequests}
      initialInstallments={initialInstallments}
      initialPaymentBehavior={initialPaymentBehavior}
      initialSchedule={initialSchedule}
      initialTimeline={initialTimeline}
      profile={initialProfile}
    />
  );
}
