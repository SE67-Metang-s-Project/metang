import { Suspense } from "react";
import TempStudentDashboard from "@/components/student/dashboard/TempStudentDashboard";

export default function StudentLoanPage() {
  return (
    <Suspense fallback={null}>
      <TempStudentDashboard />
    </Suspense>
  );
}
