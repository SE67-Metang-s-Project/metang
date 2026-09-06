"use client";

import { useRouter } from "next/navigation";
import { studentProfile } from "@/app/student/studentMockData";
import type { LoanDetails } from "@/app/student/studentMockData";
import TopNav from "@/components/shared/TopNav";
import LoanDetailsPage from "./LoanDetailsPage";
import styles from "@/app/student/student.module.css";

import type { StudentProfileDisplay } from "@/components/student/dashboard/LoanSummaryCard";

type StudentRequestDetailPageProps = {
  details: LoanDetails;
  profile?: StudentProfileDisplay;
};

export default function StudentRequestDetailPage({ details, profile }: StudentRequestDetailPageProps) {
  const router = useRouter();
  const currentProfile = profile ?? studentProfile;

  return (
    <main className={styles.studentPage}>
      <TopNav
        showSidebarButton={false}
        userEmail={
          ("contactEmail" in currentProfile && currentProfile.contactEmail) ||
          `${currentProfile.studentId}@cmu.ac.th`
        }
        userId={currentProfile.studentId}
        userName={currentProfile.displayName}
        userRole="นักศึกษา"
      />
      <div className={styles.studentPageContent}>
        <LoanDetailsPage details={details} onBack={() => router.push("/student")} />
      </div>
    </main>
  );
}
