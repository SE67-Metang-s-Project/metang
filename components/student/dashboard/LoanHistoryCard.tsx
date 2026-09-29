import type { LoanRequestHistoryItem } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";
import { localizeStudentContent, useStudentLanguage } from "@/app/student/StudentLanguageProvider";
import AdaptiveKeyValueRow from "@/components/shared/AdaptiveKeyValueRow";

type LoanHistoryCardProps = {
  onCorrectRequest?: (requestNumber: string) => void;
  onOpenRequest?: (requestNumber: string) => void;
  request: LoanRequestHistoryItem;
};

export default function LoanHistoryCard({
  onCorrectRequest,
  onOpenRequest,
  request,
}: LoanHistoryCardProps) {
  const { language, t } = useStudentLanguage();
  const [paidAmount, totalAmount] = request.amount.split("/");
  const canCorrect = request.statusType === "revisionRequired" && Boolean(onCorrectRequest);
  const submittedAt = request.submittedAt.replace(/^ยื่นเมื่อ\s*/, "");
  const amount = request.amount.replace(/\s*บาท\b/g, "");
  const isPaid =
    request.statusType === "completed" ||
    request.amountLabel === "ชำระแล้ว" ||
    ["ชำระแล้ว", "ชำระเรียบร้อยแล้ว", "ชำระเสร็จสิ้น", "Paid"].includes(request.statusLabel);
  const detailLabel = t("ดูรายละเอียดคำร้อง", "View request details");

  return (
    <article
      className={styles.historyCard}
      data-status={request.statusType}
      aria-label={onOpenRequest ? `${detailLabel}: ${request.requestNumber}` : undefined}
      onClick={onOpenRequest ? () => onOpenRequest(request.requestNumber) : undefined}
      onKeyDown={
        onOpenRequest
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpenRequest(request.requestNumber);
              }
            }
          : undefined
      }
      role={onOpenRequest ? "button" : undefined}
      tabIndex={onOpenRequest ? 0 : undefined}
    >
      <div>
        <div className={styles.historyCardTitle}>
          <strong>{request.requestNumber}</strong>
          <span
            className={`${styles.historyStatus} ${styles[request.statusType]} ${language === "en" ? styles.studentEnglishStatus : ""}`}
          >
            ● {localizeStudentContent(request.statusLabel, language)}
          </span>
        </div>
        <p className={styles.historySubmittedAt}>
          <span>{t("ยื่นเมื่อ", "Submitted")}</span>{" "}
          <span className={styles.historySubmittedDate}>{localizeStudentContent(submittedAt, language)}</span>
        </p>
        <AdaptiveKeyValueRow
          className={styles.historyPurposeRow}
          alwaysStacked
          label={t("วัตถุประสงค์การกู้ยืม", "Loan purpose")}
          labelAs="small"
          value={localizeStudentContent(request.purpose, language)}
          valueAlignment="left"
          valueAs="strong"
          valueClassName={styles.historyPurpose}
        />
        {canCorrect ? (
          <button
            className={styles.historyCorrectionButton}
            onClick={(event) => {
              event.stopPropagation();
              onCorrectRequest?.(request.requestNumber);
            }}
            onKeyDown={(event) => event.stopPropagation()}
            type="button"
          >
            {t("แก้ไขเอกสาร", "Correct documents")}
          </button>
        ) : null}
      </div>
      <div className={styles.historyAmount}>
        <span>{isPaid ? t("ชำระแล้ว", "Paid") : t("จำนวนที่ขอกู้", "Requested amount")}</span>
        <strong>
          {isPaid && totalAmount ? (
            paidAmount.trim()
          ) : request.statusType === "pending" && totalAmount ? (
            <>
              {paidAmount.trim()}
              <span className={styles.historyAmountTotal}>/{totalAmount.trim()}</span>
            </>
          ) : (
            amount
          )}
        </strong>
      </div>
    </article>
  );
}
