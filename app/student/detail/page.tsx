import { activeLoan, getLoanDetails } from "@/app/student/studentMockData";
import StudentRequestDetailPage from "@/components/student/loan-details/StudentRequestDetailPage";
import { StudentLanguageProvider } from "../StudentLanguageProvider";

type StudentDetailPageProps = {
  searchParams: Promise<{ request?: string | string[] }>;
};

export default async function StudentDetailPage({ searchParams }: StudentDetailPageProps) {
  const { request } = await searchParams;
  const requestNumber = typeof request === "string" ? request : activeLoan.requestNumber;
  const details = getLoanDetails(requestNumber) ?? getLoanDetails(activeLoan.requestNumber);

  if (!details) return null;

  return (
    <StudentLanguageProvider>
      <StudentRequestDetailPage details={details} />
    </StudentLanguageProvider>
  );
}
