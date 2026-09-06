"use client";

import { useRouter } from "next/navigation";
import { studentProfile } from "@/app/student/studentMockData";
import type { LoanDetails } from "@/app/student/studentMockData";
import TopNav from "@/components/shared/TopNav";
import LoanDetailsPage from "./LoanDetailsPage";
import styles from "@/app/student/student.module.css";

type StudentRequestDetailPageProps = {
  details: LoanDetails;
};

export default function StudentRequestDetailPage({ details }: StudentRequestDetailPageProps) {
  const router = useRouter();

  return (
    <main className={styles.studentPage}>
      <TopNav
        showSidebarButton={false}
        userEmail={`${studentProfile.studentId}@cmu.ac.th`}
        userId={studentProfile.studentId}
        userName={studentProfile.displayName}
        userRole="นักศึกษา"
      />
      <div className={styles.studentPageContent}>
        <LoanDetailsPage details={details} onBack={() => router.push("/student")} />
      </div>
    </main>
  );
}
