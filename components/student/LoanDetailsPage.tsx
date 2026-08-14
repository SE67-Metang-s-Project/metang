import type { LoanDetails } from "@/app/student/studentMockData";
import LoanContactCard from "./LoanContactCard";
import LoanDetailSchedule from "./LoanDetailSchedule";
import LoanPaymentHistory from "./LoanPaymentHistory";
import LoanTimeline from "./LoanTimeline";
import styles from "@/app/student/student.module.css";

type LoanDetailsPageProps = {
  details: LoanDetails;
  onBack: () => void;
};

export default function LoanDetailsPage({ details, onBack }: LoanDetailsPageProps) {
  return (
    <div className={styles.loanDetailsPage}>
      <button aria-label="กลับหน้าหลัก" className={styles.loanDetailsBack} onClick={onBack} type="button">
        ← กลับหน้าหลัก
      </button>

      <section className={`${styles.loanDetailSection} ${styles.loanDetailOverview}`}>
        <div className={styles.loanDetailTopline}>
          <div>
            <h1>คำร้อง {details.requestNumber}</h1>
            <p>{details.submittedAt}</p>
          </div>
          <span className={styles.loanDetailStatus}>{details.statusLabel}</span>
        </div>
        <div className={styles.loanDetailOverviewGrid}>
          <div>
            <span>{details.purposeLabel}</span>
            <strong>{details.purpose}</strong>
          </div>
          <div className={styles.loanDetailAmount}>
            <span>{details.amountLabel}</span>
            <strong>{details.amount}</strong>
          </div>
          <div>
            <span>{details.additionalReasonLabel}</span>
            <strong>{details.additionalReason}</strong>
          </div>
          <div className={styles.loanDetailAmountMeta}>
            <span>สถานะการโอนเงิน</span>
            <strong>จำนวน 3 งวด</strong>
          </div>
        </div>
        <button className={styles.loanDownloadButton} type="button">
          <span aria-hidden="true">⇩</span>
          {details.downloadLabel}
        </button>
      </section>

      <LoanTimeline items={details.timeline} />
      <LoanDetailSchedule items={details.schedule} />
      <LoanPaymentHistory items={details.paymentHistory} />
      <LoanContactCard contact={details.contact} />
    </div>
  );
}
