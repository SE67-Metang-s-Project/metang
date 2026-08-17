import { Suspense } from "react";
import TempLoanApplicationPage from "@/components/student/application/TempLoanApplicationPage";

export default function TempLoanApplyPage() {
  return (
    <Suspense fallback={null}>
      <TempLoanApplicationPage />
    </Suspense>
  );
}
