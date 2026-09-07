import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { requireStudentAccess } from "@/lib/loan-auth";
import { getStudentCurrentLoan, getStudentLoanDetail } from "@/db/queries/loan-requests";
import { mapToLoanDetails, type RawStudentLoan } from "@/lib/student-view-model";
import StudentRequestDetailPage from "@/components/student/loan-details/StudentRequestDetailPage";
import TopNav from "@/components/shared/TopNav";
import { activeLoan, getLoanDetails } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";

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

  if (!details) {
    return (
      <main className={styles.studentPage}>
        <TopNav
          showSidebarButton={false}
          userEmail={profile.contactEmail}
          userId={profile.studentId}
          userName={profile.displayName}
          userRole="นักศึกษา"
        />
        <div className={styles.studentPageContent}>
          <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <AlertCircle aria-hidden="true" className="mx-auto text-amber-500" size={48} />
            <h2 className="mt-4 text-xl font-bold text-gray-900">ไม่พบข้อมูลคำร้อง</h2>
            <p className="mt-2 text-sm text-gray-600">
              {requestId
                ? `ไม่พบข้อมูลคำร้องหมายเลข "${requestId}" หรือคำร้องนี้อาจถูกลบไปแล้ว`
                : "ไม่พบข้อมูลคำร้องขอกู้ยืมในระบบ"}
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                href="/student"
              >
                <ArrowLeft size={16} />
                กลับหน้าหลัก
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return <StudentRequestDetailPage details={details} profile={profile} />;
}
