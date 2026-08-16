import {
  tempLoanTimeline,
  tempStudentProfile,
  tempCurrentLoanDetails,
  type TempLoanFormData,
} from "@/app/student/temp/tempMockData";
import styles from "@/app/student/student.module.css";
import LoanDetailSchedule from "../loan-details/LoanDetailSchedule";
import LoanDetailOverview from "../loan-details/LoanDetailOverview";
import LoanTimeline from "../loan-details/LoanTimeline";

type TempLoanDetailsStepProps = {
  formData: TempLoanFormData;
};

const studentName =
  tempStudentProfile.displayName.replace("นางสาว", "").trim() + " มีโชค";

export default function TempLoanDetailsStep({ formData }: TempLoanDetailsStepProps) {
  const loanAmount = Number(formData.loanAmount) || 0;
  const baseInstallmentAmount = Math.floor(loanAmount / formData.installmentCount);
  const installmentRemainder = loanAmount % formData.installmentCount;
  const schedule = Array.from({ length: formData.installmentCount }, (_, index) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30 * (index + 1));

    return {
      installmentNumber: index + 1,
      dueDateLabel: `ครบกำหนด ${dueDate.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`,
      amount: `฿${(
        baseInstallmentAmount +
        (index === formData.installmentCount - 1 ? installmentRemainder : 0)
      ).toLocaleString("th-TH")}`,
    };
  });
  const details = {
    ...tempCurrentLoanDetails,
    amount: formData.loanAmount ? `฿${Number(formData.loanAmount).toLocaleString("th-TH")}` : "฿0",
    purpose: formData.purpose || tempCurrentLoanDetails.purpose,
    additionalReason: formData.additionalNote === "-" ? "-" : formData.additionalNote,
  };

  return (
    <section className={styles.tempLoanDetailsSection} aria-labelledby="loan-details-step-title">
      <h2 id="loan-details-step-title">ขั้นตอนที่ 3: รายละเอียดการกู้ยืม</h2>

      <LoanDetailOverview details={details} />
      <LoanTimeline
        items={tempLoanTimeline}
        confirmTransferLabel="ยืนยันการรับเงิน"
        onShowTransferSlip={() => undefined}
      />

      <section className={styles.tempDetailCard}>
        <h3>ข้อมูลนักศึกษา</h3>
        <dl className={styles.tempDetailDefinitionList}>
          <div>
            <dt>ชื่อ-นามสกุล:</dt>
            <dd>{studentName}</dd>
          </div>
          <div>
            <dt>รหัสนักศึกษา:</dt>
            <dd>{tempStudentProfile.studentId}</dd>
          </div>
          <div>
            <dt>หลักสูตร:</dt>
            <dd>{tempStudentProfile.programName}</dd>
          </div>
          <div>
            <dt>ชั้นปีการศึกษา:</dt>
            <dd>ชั้นปีที่ {formData.academicYear}</dd>
          </div>
          <div>
            <dt>อาจารย์ที่ปรึกษา:</dt>
            <dd>{formData.advisorName || "-"}</dd>
          </div>
          <div>
            <dt>เบอร์โทรศัพท์:</dt>
            <dd>{formData.phoneNumber || "-"}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.tempDetailCard}>
        <h3>ข้อมูลธนาคาร</h3>
        <dl className={styles.tempDetailDefinitionList}>
          <div>
            <dt>ธนาคาร:</dt>
            <dd>{formData.bankName || "-"}</dd>
          </div>
          <div>
            <dt>เลขที่บัญชี:</dt>
            <dd>{formData.accountNumber || "-"}</dd>
          </div>
          <div>
            <dt>ชื่อบัญชี:</dt>
            <dd>{formData.accountName || "-"}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.tempDetailCard}>
        <h3>ข้อมูลการกู้ยืม</h3>
        <dl className={styles.tempDetailDefinitionList}>
          <div>
            <dt>วัตถุประสงค์การกู้ยืม:</dt>
            <dd>{formData.purpose || "จ่ายค่าเทอม"}</dd>
          </div>
          <div>
            <dt>หมายเหตุเพิ่มเติม:</dt>
            <dd>{formData.additionalNote || "-"}</dd>
          </div>
          <div>
            <dt>จำนวนเงินที่ขอกู้ยืม (บาท):</dt>
            <dd>฿{formData.loanAmount || "0"}</dd>
          </div>
          <div>
            <dt>จำนวนเงินตัวอักษร:</dt>
            <dd>สามพันบาทไทยถ้วน</dd>
          </div>
          <div>
            <dt>จำนวนงวดการชำระ:</dt>
            <dd>{formData.installmentCount} งวด</dd>
          </div>
        </dl>
        <LoanDetailSchedule items={schedule} />
      </section>
    </section>
  );
}
