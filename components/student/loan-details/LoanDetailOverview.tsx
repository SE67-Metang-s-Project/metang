import type { LoanDetails } from "@/app/student/studentMockData";
import { formatThaiBahtText } from "@/app/student/studentFormatters";
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
  >;
};

export default function LoanDetailOverview({ details }: LoanDetailOverviewProps) {
  return (
    <section className={`${styles.loanDetailSection} ${styles.loanDetailOverview}`}>
      <div className={styles.loanDetailTopline}>
        <div>
          <h1>คำร้อง {details.requestNumber}</h1>
        </div>
        <span className={styles.loanDetailStatus}>{details.statusLabel}</span>
      </div>
      <div className={styles.loanDetailOverviewGrid}>
        <div className={styles.loanDetailSubmittedAt}>
          <p>{details.submittedAt}</p>
        </div>
        <div className={styles.loanDetailAmountValue}>
          <strong>{details.amount}</strong>
        </div>
        <div className={styles.loanDetailPurpose}>
          <span>{details.purposeLabel}</span>
          <strong>{details.purpose}</strong>
        </div>
        <div className={styles.loanDetailRepaymentMeta}>
          <span>{formatThaiBahtText(details.amount)}</span>
          <span>จำนวน 3 งวด</span>
        </div>
        <div className={styles.loanDetailAdditionalReason}>
          <span>{details.additionalReasonLabel}</span>
          <strong>{details.additionalReason}</strong>
        </div>
      </div>
      {details.downloadLabel ? (
        <button className={styles.loanDownloadButton} type="button">
          <span aria-hidden="true">⇩</span>
          {details.downloadLabel}
        </button>
      ) : null}
    </section>
  );
}
