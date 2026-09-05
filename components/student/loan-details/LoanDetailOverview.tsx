import { Download } from "lucide-react";
import type { LoanDetails } from "@/app/student/studentMockData";
import StatusPill from "@/components/shared/StatusPill";
import styles from "@/app/student/student.module.css";

type LoanDetailOverviewProps = {
  details: Pick<
    LoanDetails,
    | "requestNumber"
    | "statusLabel"
    | "submittedAt"
    | "purposeLabel"
    | "purpose"
    | "amount"
    | "downloadLabel"
    | "additionalReasonLabel"
    | "additionalReason"
  > & {
    schedule?: LoanDetails["schedule"];
  };
};

const getHistoryStatusClassName = (statusLabel: string) => {
  if (statusLabel.includes("ปฏิเสธ")) return styles.rejectedExecutive;
  if (statusLabel.includes("ยืนยันการรับเงิน")) return styles.waitingPaymentConfirmation;
  if (statusLabel.includes("แก้ไข")) return styles.revisionRequired;
  if (statusLabel.includes("อาจารย์")) return styles.waitingAdvisorApproval;
  if (statusLabel.includes("ผู้บริหาร")) return styles.waitingExecutiveApproval;
  if (statusLabel.includes("เจ้าหน้าที่")) return styles.waitingDocumentReview;
  if (statusLabel.includes("เสร็จสิ้น")) return styles.completed;

  return styles.pending;
};

export default function LoanDetailOverview({ details }: LoanDetailOverviewProps) {
  const isAdditionalReasonLong = details.additionalReason.length > 30;
  const isPurposeLong = details.purpose.length > 30;

  return (
    <section className={`${styles.loanDetailSection} ${styles.detailDashboardCard} ${styles.loanDetailOverview}`}>
      <header className={`${styles.sectionCardHeading} ${styles.loanDetailOverviewHeader}`}>
        <h2>คำร้อง {details.requestNumber}</h2>
        <StatusPill
          className={getHistoryStatusClassName(details.statusLabel)}
          label={details.statusLabel}
        />
      </header>
      <div className={styles.loanDetailSummary}>
        <div className={styles.loanDetailAmountSummary}>
          <span>จำนวนเงินที่ขอกู้</span>
          <strong>{details.amount}</strong>
        </div>
        {details.schedule ? (
          <div className={styles.loanDetailInstallmentSummary}>
            <span>จำนวนงวด</span>
            <strong>{details.schedule.length} งวด</strong>
          </div>
        ) : null}
      </div>
      <dl className={styles.loanDetailInfoList}>
        <div className={isPurposeLong ? styles.loanDetailPurposeLong : undefined}>
          <dt>ยื่นเมื่อ</dt>
          <dd>{details.submittedAt.replace(/^ยื่นเมื่อ\s*/, "")}</dd>
        </div>
        <div>
          <dt>{details.purposeLabel}</dt>
          <dd>{details.purpose}</dd>
        </div>
        <div className={isAdditionalReasonLong ? styles.loanDetailAdditionalNoteLong : undefined}>
          <dt>{details.additionalReasonLabel}</dt>
          <dd>{details.additionalReason}</dd>
        </div>
      </dl>
      {details.downloadLabel ? (
        <button className={styles.loanDownloadButton} type="button">
          <Download aria-hidden="true" size={18} />
          <strong>{details.downloadLabel}</strong>
        </button>
      ) : null}
    </section>
  );
}
