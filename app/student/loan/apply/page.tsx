import { Suspense } from "react";
import TempLoanApplicationPage from "@/components/student/application/TempLoanApplicationPage";
import { StudentLanguageProvider } from "../../StudentLanguageProvider";

export default function StudentLoanApplyPage() {
  return (
    <Suspense fallback={null}>
      <StudentLanguageProvider>
        <TempLoanApplicationPage />
      </StudentLanguageProvider>
    </Suspense>
  );
}
