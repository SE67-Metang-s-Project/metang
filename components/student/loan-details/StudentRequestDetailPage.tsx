"use client";

import { studentProfile } from "@/app/student/studentMockData";
import type { LoanDetails } from "@/app/student/studentMockData";
import StudentTopNav from "@/components/student/StudentTopNav";
import LoanDetailsPage from "./LoanDetailsPage";
import styles from "@/app/student/student.module.css";

import type { StudentProfileDisplay } from "@/components/student/dashboard/LoanSummaryCard";

type StudentRequestDetailPageProps = {
  details: LoanDetails;
  profile?: StudentProfileDisplay & { phoneNumber?: string };
};

export default function StudentRequestDetailPage({ details, profile }: StudentRequestDetailPageProps) {
  const currentProfile: StudentProfileDisplay & { phoneNumber?: string } = profile ?? studentProfile;

  return (
    <main className={styles.studentPage}>
      <StudentTopNav
        showSidebarButton={false}
        userEmail={
          ("contactEmail" in currentProfile && currentProfile.contactEmail) ||
          `${currentProfile.studentId}@cmu.ac.th`
        }
        userId={currentProfile.studentId}
        userName={currentProfile.displayName}
        userNameEn={currentProfile.displayNameEn}
        userRole="นักศึกษา"
      />
      <div className={`${styles.studentPageContent} ${styles.studentDetailPageContent}`}>
        <LoanDetailsPage details={details} profile={currentProfile} />
      </div>
    </main>
  );
}
