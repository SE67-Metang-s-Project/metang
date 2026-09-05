import { GraduationCap, Landmark } from "lucide-react";
import { paymentAccount, studentProfile } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";

export default function TempDetailCard() {
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
            <dd>{studentProfile.displayName}</dd>
          </div>
          <div>
            <dt>รหัสนักศึกษา</dt>
            <dd>{studentProfile.studentId}</dd>
          </div>
          <div>
            <dt>หลักสูตร</dt>
            <dd>{studentProfile.programName}</dd>
          </div>
          <div>
            <dt>วุฒิการศึกษา</dt>
            <dd>{studentProfile.educationLevel}</dd>
          </div>
          <div>
            <dt>ชั้นปีการศึกษา</dt>
            <dd>{studentProfile.yearLabel}</dd>
          </div>
          <div>
            <dt>เบอร์โทรศัพท์</dt>
            <dd>0950000000</dd>
          </div>
          <div>
            <dt>อาจารย์ที่ปรึกษา</dt>
            <dd>ดร.พิมพา มีโชค</dd>
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
            <dd>{paymentAccount.bankName}</dd>
          </div>
          <div>
            <dt>เลขที่บัญชี</dt>
            <dd>{paymentAccount.accountNumber}</dd>
          </div>
          <div className={styles.bankAccountNameRow}>
            <dt>ชื่อบัญชี</dt>
            <dd>{paymentAccount.accountName}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
