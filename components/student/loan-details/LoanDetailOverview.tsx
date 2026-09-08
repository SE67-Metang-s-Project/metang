import { Download } from "lucide-react";
import type { LoanDetails, LoanRequestStatus } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";
import { localizeStudentContent, useStudentLanguage } from "@/app/student/StudentLanguageProvider";

type LoanDetailOverviewProps = {
  details: Pick<
    LoanDetails,
    | "requestNumber"
    | "statusCode"
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
  showDownload?: boolean;
};

const statusTypeByCode: Record<string, LoanRequestStatus> = {
  returned: "revisionRequired",
  pending_advisor: "waitingAdvisorApproval",
  pending_admin: "waitingDocumentReview",
  pending_executive: "waitingExecutiveApproval",
  pending_disbursement: "waitingPaymentConfirmation",
  disbursed: "pending",
  closed: "completed",
  rejected: "rejectedExecutive",
  cancelled: "rejectedExecutive",
};

const getHistoryStatusClassName = (statusCode: string | undefined, statusLabel: string) => {
  if (statusCode && statusTypeByCode[statusCode]) return styles[statusTypeByCode[statusCode]];
  if (statusLabel.includes("ปฏิเสธ")) return styles.rejectedExecutive;
  if (statusLabel.includes("ไม่อนุมัติ")) return styles.rejectedExecutive;
  if (statusLabel.includes("ยืนยันการรับเงิน")) return styles.waitingPaymentConfirmation;
  if (statusLabel.includes("แก้ไข")) return styles.revisionRequired;
  if (statusLabel.includes("อาจารย์")) return styles.waitingAdvisorApproval;
  if (statusLabel.includes("ผู้บริหาร")) return styles.waitingExecutiveApproval;
  if (statusLabel.includes("เจ้าหน้าที่")) return styles.waitingDocumentReview;
  if (statusLabel.includes("เสร็จสิ้น")) return styles.completed;

  return styles.pending;
};

export default function LoanDetailOverview({ details, showDownload = false }: LoanDetailOverviewProps) {
  const { language, t } = useStudentLanguage();
  const isAdditionalReasonLong = details.additionalReason.length > 30;
  const isPurposeLong = details.purpose.length > 30;

  return (
    <section className={`${styles.loanDetailSection} ${styles.detailDashboardCard} ${styles.loanDetailOverview}`}>
      <header className={`${styles.sectionCardHeading} ${styles.loanDetailOverviewHeader}`}>
        <h2>{details.requestNumber}</h2>
        <span className={`${styles.historyStatus} ${getHistoryStatusClassName(details.statusCode, details.statusLabel)}`}>
          ● {localizeStudentContent(details.statusLabel, language)}
        </span>
      </header>
      <div className={styles.loanDetailSummary}>
        <div className={styles.loanDetailAmountSummary}>
          <span>{t("จำนวนเงินที่ขอกู้", "Requested amount")}</span>
          <strong>{details.amount}</strong>
        </div>
        {details.schedule ? (
          <div className={styles.loanDetailInstallmentSummary}>
            <span>{t("จำนวนงวด", "Installments")}</span>
            <strong>{details.schedule.length} {t("งวด", "installments")}</strong>
          </div>
        ) : null}
      </div>
      <dl className={styles.loanDetailInfoList}>
        <div>
          <dt>{t("ยื่นเมื่อ", "Submitted")}</dt>
          <dd className={styles.loanDetailSubmittedAt}>
            {localizeStudentContent(details.submittedAt.replace(/^ยื่นเมื่อ\s*/, ""), language)}
          </dd>
        </div>
        <div className={isPurposeLong ? styles.loanDetailPurposeLong : undefined}>
          <dt>{t(details.purposeLabel, "Loan purpose")}</dt>
          <dd>{localizeStudentContent(details.purpose, language)}</dd>
        </div>
        <div className={isAdditionalReasonLong ? styles.loanDetailAdditionalNoteLong : undefined}>
          <dt>{t(details.additionalReasonLabel, "Additional note")}</dt>
          <dd>{localizeStudentContent(details.additionalReason, language)}</dd>
        </div>
      </dl>
      {showDownload && details.downloadLabel ? (
        <button className={styles.loanDownloadButton} type="button">
          <Download aria-hidden="true" size={18} />
          <strong>{t(details.downloadLabel, "Download loan agreement")}</strong>
        </button>
      ) : null}
    </section>
  );
}
