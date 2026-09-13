import { GraduationCap, Landmark } from "lucide-react";
import type { LoanDetails } from "@/app/student/studentMockData";
import type { StudentProfileDisplay } from "@/components/student/dashboard/LoanSummaryCard";
import styles from "@/app/student/student.module.css";

type TempDetailCardProps = {
  details: LoanDetails;
  profile: StudentProfileDisplay & { phoneNumber?: string };
};

const educationLevelsByStudentIdDigit: Record<string, string> = {
  "0": "ประกาศนียบัตรผู้ช่วยพยาบาล",
  "1": "ปริญญาตรี",
  "3": "ปริญญาโท",
  "5": "ปริญญาเอก",
};

export default function TempDetailCard({ details, profile }: TempDetailCardProps) {
  const educationLevel =
    educationLevelsByStudentIdDigit[profile.studentId.charAt(4)] ?? profile.educationLevel ?? "-";

  return (
    <>
      <section className={`${styles.loanDetailSection} ${styles.detailDashboardCard}`}>
        <header className={styles.sectionCardHeading}>
          <h2>
            <GraduationCap aria-hidden="true" size={23} strokeWidth={2.2} />
            ข้อมูลนักศึกษา
          </h2>
        </header>
        <dl className={styles.loanDetailDefinitionList}>
          <div>
            <dt>ชื่อ-นามสกุล</dt>
            <dd>{profile.displayName}</dd>
          </div>
          <div>
            <dt>รหัสนักศึกษา</dt>
            <dd>{profile.studentId}</dd>
          </div>
          <div>
            <dt>หลักสูตร</dt>
            <dd>{profile.programName || "พยาบาลศาสตรบัณฑิต"}</dd>
          </div>
          <div>
            <dt>วุฒิการศึกษา</dt>
            <dd>{educationLevel}</dd>
          </div>
          <div>
            <dt>ชั้นปีการศึกษา</dt>
            <dd>{details.studentYear ? `ชั้นปีที่ ${details.studentYear}` : "-"}</dd>
          </div>
          <div>
            <dt>เบอร์โทรศัพท์</dt>
            <dd>{profile.phoneNumber || "-"}</dd>
          </div>
          <div>
            <dt>อาจารย์ที่ปรึกษา</dt>
            <dd>{details.advisorName || "-"}</dd>
          </div>
        </dl>
      </section>

      <section className={`${styles.loanDetailSection} ${styles.detailDashboardCard}`}>
        <header className={styles.sectionCardHeading}>
          <h2>
            <Landmark aria-hidden="true" size={23} strokeWidth={2.2} />
            ข้อมูลธนาคาร
          </h2>
        </header>
        <dl className={styles.loanDetailDefinitionList}>
          <div>
            <dt>ธนาคาร</dt>
            <dd>{details.bankName || "-"}</dd>
          </div>
          <div>
            <dt>เลขที่บัญชี</dt>
            <dd>{details.bankAccountNo || "-"}</dd>
          </div>
          <div className={styles.bankAccountNameRow}>
            <dt>ชื่อบัญชี</dt>
            <dd>{details.bankAccountName || "-"}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
