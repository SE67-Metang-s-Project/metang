import { requireStudentAccess } from "@/lib/loan-auth";
import { getStudentCurrentLoan, getStudentLoanDetail } from "@/db/queries/loan-requests";
import { mapToLoanDetails, type RawStudentLoan } from "@/lib/student-view-model";
import StudentRequestDetailPage from "@/components/student/loan-details/StudentRequestDetailPage";
import { activeLoan, getLoanDetails } from "@/app/student/studentMockData";

export const dynamic = "force-dynamic";

type StudentDetailPageProps = {
  searchParams: Promise<{ request?: string | string[] }>;
};

export default async function StudentDetailPage({ searchParams }: StudentDetailPageProps) {
  const context = await requireStudentAccess();
  const { request } = await searchParams;
  const requestId = typeof request === "string" ? request : undefined;

  let loan: RawStudentLoan | null = null;
  if (requestId) {
    loan = (await getStudentLoanDetail(requestId, context.user.id).catch(() => null)) as RawStudentLoan | null;
  }
  if (!loan) {
    loan = (await getStudentCurrentLoan(context.user.id).catch(() => null)) as RawStudentLoan | null;
  }

  const profile = {
    displayName: context.user.fullNameTh || context.identity.displayName || "นักศึกษา",
    studentId: context.user.studentCode || context.identity.studentCode || "",
    educationLevel: context.user.educationLevel ?? undefined,
    programName: "พยาบาลศาสตรบัณฑิต",
    contactEmail: context.user.email || `${context.user.studentCode}@cmu.ac.th`,
  };

  const details = loan
    ? mapToLoanDetails(loan)
    : (getLoanDetails(requestId ?? activeLoan.requestNumber) ?? null);

  if (!details) return null;

  return <StudentRequestDetailPage details={details} profile={profile} />;
}
