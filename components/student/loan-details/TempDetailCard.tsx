import { paymentAccount, studentProfile } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";

export default function TempDetailCard() {
  return (
    <>
      <section className={styles.tempDetailCard}>
        <h3 className={styles.loanDetailInfoHeading}>ข้อมูลนักศึกษา</h3>
        <dl className={styles.tempDetailDefinitionList}>
          <div>
            <dt>ชื่อ-นามสกุล:</dt>
            <dd>{studentProfile.displayName}</dd>
          </div>
          <div>
            <dt>รหัสนักศึกษา:</dt>
            <dd>{studentProfile.studentId}</dd>
          </div>
          <div>
            <dt>หลักสูตร:</dt>
            <dd>{studentProfile.programName}</dd>
          </div>
          <div>
            <dt>ชั้นปีการศึกษา:</dt>
            <dd>{studentProfile.yearLabel}</dd>
          </div>
          <div>
            <dt>อาจารย์ที่ปรึกษา:</dt>
            <dd>ดร.พิมพา มีโชค</dd>
          </div>
          <div>
            <dt>เบอร์โทรศัพท์:</dt>
            <dd>0950000000</dd>
          </div>
        </dl>
      </section>

      <section className={styles.tempDetailCard}>
        <h3 className={styles.loanDetailInfoHeading}>ข้อมูลธนาคาร</h3>
        <dl className={styles.tempDetailDefinitionList}>
          <div>
            <dt>ธนาคาร:</dt>
            <dd>{paymentAccount.bankName}</dd>
          </div>
          <div>
            <dt>เลขที่บัญชี:</dt>
            <dd>{paymentAccount.accountNumber}</dd>
          </div>
          <div>
            <dt>ชื่อบัญชี:</dt>
            <dd>{paymentAccount.accountName}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
