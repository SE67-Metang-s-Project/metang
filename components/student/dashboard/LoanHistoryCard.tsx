import type { LoanRequestHistoryItem } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";
import { localizeStudentContent, useStudentLanguage } from "@/app/student/StudentLanguageProvider";

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

  return (
    <article
      className={styles.historyCard}
      data-status={request.statusType}
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
          <strong>{t("คำร้อง", "Request")} {request.requestNumber}</strong>
          <span className={`${styles.historyStatus} ${styles[request.statusType]}`}>
            ● {localizeStudentContent(request.statusLabel, language)}
          </span>
        </div>
        <p>{localizeStudentContent(request.submittedAt, language)}</p>
        <small>{t("วัตถุประสงค์การกู้ยืม", "Loan purpose")}</small>
        <strong>{localizeStudentContent(request.purpose, language)}</strong>
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
        <span>{request.amountLabel === "ชำระแล้ว" ? t("ชำระแล้ว", "Paid") : t("จำนวนที่ขอกู้", "Requested amount")}</span>
        <strong>
          {request.statusType === "pending" && totalAmount ? (
            <>
              {paidAmount.trim()}
              <span className={styles.historyAmountTotal}>/{totalAmount.trim()}</span>
            </>
          ) : (
            request.amount
          )}
        </strong>
      </div>
    </article>
  );
}
