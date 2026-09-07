import {
  tempLoanTimeline,
  tempStudentProfile,
  tempCurrentLoanDetails,
  type TempLoanFormData,
} from "@/app/student/temp/tempMockData";
import { HandCoins, Landmark, UserRound } from "lucide-react";
import styles from "@/app/student/student.module.css";
import { formatThaiBahtText } from "@/app/student/studentFormatters";
import CardHeader from "@/components/shared/CardHeader";
import LoanDetailSchedule from "../loan-details/LoanDetailSchedule";
import LoanDetailOverview from "../loan-details/LoanDetailOverview";
import LoanTimeline from "../loan-details/LoanTimeline";

import type { StudentProfileDisplay } from "../dashboard/LoanSummaryCard";
import { mapToLoanDetails, type RawStudentLoan } from "@/lib/student-view-model";

type TempLoanDetailsStepProps = {
  formData: TempLoanFormData;
  profile?: StudentProfileDisplay;
  createdLoan?: RawStudentLoan | null;
};

export default function TempLoanDetailsStep({
  formData,
  profile,
  createdLoan,
}: TempLoanDetailsStepProps) {
  const currentProfile = profile ?? tempStudentProfile;
  const studentName = currentProfile.displayName.replace("นางสาว", "").trim();

  const mappedLoanDetails = createdLoan ? mapToLoanDetails(createdLoan) : null;

  const loanAmount = Number(formData.loanAmount) || 0;
  const baseInstallmentAmount = Math.floor(loanAmount / formData.installmentCount);
  const installmentRemainder = loanAmount % formData.installmentCount;
  const fallbackSchedule = Array.from({ length: formData.installmentCount }, (_, index) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30 * (index + 1));

    return {
      installmentNumber: index + 1,
      dueDateLabel: `ครบกำหนด ${dueDate.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`,
      amount: `${(
        baseInstallmentAmount +
        (index === formData.installmentCount - 1 ? installmentRemainder : 0)
      ).toLocaleString("th-TH")}`,
    };
  });

  const schedule = mappedLoanDetails?.schedule?.length ? mappedLoanDetails.schedule : fallbackSchedule;
  const timelineItems = mappedLoanDetails?.timeline?.length ? mappedLoanDetails.timeline : tempLoanTimeline;

  const details = {
    ...tempCurrentLoanDetails,
    requestNumber: mappedLoanDetails?.requestNumber ?? tempCurrentLoanDetails.requestNumber,
    statusLabel: mappedLoanDetails?.statusLabel ?? "รออาจารย์ที่ปรึกษาพิจารณา",
    submittedAt: mappedLoanDetails?.submittedAt ?? tempCurrentLoanDetails.submittedAt,
    amount: formData.loanAmount ? `${Number(formData.loanAmount).toLocaleString("th-TH")}` : "0",
    purpose: formData.purpose || tempCurrentLoanDetails.purpose,
    additionalReason: formData.additionalNote === "-" ? "-" : formData.additionalNote,
    schedule,
  };

  return (
    <section className={styles.tempLoanDetailsSection} aria-labelledby="loan-details-step-title">
      <h2 id="loan-details-step-title">ขั้นตอนที่ 3: รายละเอียดการกู้ยืม</h2>

      <LoanDetailOverview details={details} />
      <LoanTimeline
        items={timelineItems}
        confirmTransferLabel="ยืนยันการรับเงิน"
        onShowTransferSlip={() => undefined}
      />

      <section className={styles.tempDetailCard}>
        <CardHeader
          className={styles.sectionCardHeading}
          icon={<UserRound aria-hidden="true" size={20} strokeWidth={2.2} />}
          title="ข้อมูลนักศึกษา"
        />
        <dl className={styles.tempDetailDefinitionList}>
          <div>
            <dt>ชื่อ-นามสกุล</dt>
            <dd>{studentName}</dd>
          </div>
          <div>
            <dt>รหัสนักศึกษา</dt>
            <dd>{currentProfile.studentId}</dd>
          </div>
          <div>
            <dt>หลักสูตร</dt>
            <dd>{currentProfile.programName || "พยาบาลศาสตรบัณฑิต"}</dd>
          </div>
          <div>
            <dt>วุฒิการศึกษา</dt>
            <dd>{formData.educationLevel || "-"}</dd>
          </div>
          <div>
            <dt>ชั้นปีการศึกษา</dt>
            <dd>ชั้นปีที่ {formData.academicYear}</dd>
          </div>
          <div>
            <dt>เบอร์โทรศัพท์</dt>
            <dd>{formData.phoneNumber || "-"}</dd>
          </div>
          <div>
            <dt>อาจารย์ที่ปรึกษา</dt>
            <dd>{formData.advisorName || "-"}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.tempDetailCard}>
        <CardHeader
          className={styles.sectionCardHeading}
          icon={<Landmark aria-hidden="true" size={20} strokeWidth={2.2} />}
          title="ข้อมูลธนาคาร"
        />
        <dl className={styles.tempDetailDefinitionList}>
          <div>
            <dt>ธนาคาร</dt>
            <dd>{formData.bankName || "-"}</dd>
          </div>
          <div>
            <dt>เลขที่บัญชี</dt>
            <dd>{formData.accountNumber || "-"}</dd>
          </div>
          <div>
            <dt>ชื่อบัญชี</dt>
            <dd>{formData.accountName || "-"}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.tempDetailCard}>
        <CardHeader
          className={styles.sectionCardHeading}
          icon={<HandCoins aria-hidden="true" size={20} strokeWidth={2.2} />}
          title="ข้อมูลการกู้ยืม"
        />
        <dl className={styles.tempDetailDefinitionList}>
          <div>
            <dt>วัตถุประสงค์การกู้ยืม</dt>
            <dd>{formData.purpose || "จ่ายค่าเทอม"}</dd>
          </div>
          <div>
            <dt>หมายเหตุเพิ่มเติม</dt>
            <dd>{formData.additionalNote || "-"}</dd>
          </div>
          <div className={styles.loanAmountRow}>
            <dt>จำนวนเงินที่ขอกู้ยืม (บาท)</dt>
            <dd>{formData.loanAmount || "0"}</dd>
          </div>
          <div>
            <dt>จำนวนเงินตัวอักษร</dt>
            <dd>{formatThaiBahtText(formData.loanAmount || "0")}</dd>
          </div>
          <div>
            <dt>จำนวนงวดการชำระ</dt>
            <dd>{formData.installmentCount} งวด</dd>
          </div>
        </dl>
      </section>

      <LoanDetailSchedule items={schedule} />
    </section>
  );
}
