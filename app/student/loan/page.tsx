import { Suspense } from "react";
import TempStudentDashboard from "@/components/student/dashboard/TempStudentDashboard";
import { StudentLanguageProvider } from "../StudentLanguageProvider";

export default function StudentLoanPage() {
  return (
    <Suspense fallback={null}>
      <StudentLanguageProvider>
        <TempStudentDashboard />
      </StudentLanguageProvider>
    </Suspense>
  );
}
