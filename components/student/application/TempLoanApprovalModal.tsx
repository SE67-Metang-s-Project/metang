import type { TempLoanFormData } from "@/app/student/temp/tempMockData";
import { tempLoanFormOptions, tempStudentProfile } from "@/app/student/temp/tempMockData";
import {
  formatEnglishBahtText,
  formatThaiBahtText,
  parseLoanAmount,
} from "@/app/student/studentFormatters";
import { AlertCircle, Landmark, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { localizeStudentContent, useStudentLanguage } from "@/app/student/StudentLanguageProvider";
import styles from "@/app/student/student.module.css";
import BahtCoinIcon from "@/components/shared/BahtCoinIcon";
import CardHeader from "@/components/shared/CardHeader";
import LoanDetailSchedule from "../loan-details/LoanDetailSchedule";
import { useModalDismiss } from "@/hooks/useBodyScrollLock";

import type { StudentProfileDisplay } from "@/components/student/dashboard/LoanSummaryCard";
import type { StudentUiError } from "@/lib/student-error-mapper";

type TempLoanApprovalModalProps = {
  formData: TempLoanFormData;
  profile?: StudentProfileDisplay;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  errorDetails?: StudentUiError | null;
  isResubmit?: boolean;
};

function getProgramLabel(programName: string | undefined, language: "th" | "en") {
  const program = programName?.trim() ?? "";
  const isNursingProgram = program.includes("พยาบาลศาสตรบัณฑิต");
  const isInternationalProgram = program.includes("นานาชาติ") || /international/i.test(program);

  if (!isNursingProgram) return localizeStudentContent(program, language);

  if (language === "en") {
    return isInternationalProgram
      ? "Bachelor of Nursing Science Program (International Program)"
      : "Bachelor of Nursing Science Program";
  }

  return isInternationalProgram
    ? "หลักสูตรพยาบาลศาสตรบัณฑิต (หลักสูตรนานาชาติ)"
    : "หลักสูตรพยาบาลศาสตรบัณฑิต";
}

export default function TempLoanApprovalModal({
  formData,
  profile,
  onClose,
  onConfirm,
  isSubmitting = false,
  errorMessage = null,
  errorDetails = null,
  isResubmit = false,
}: TempLoanApprovalModalProps) {
  const router = useRouter();
  const { language, t } = useStudentLanguage();
  const currentProfile: StudentProfileDisplay = profile ?? tempStudentProfile;
  const studentName =
    language === "en"
      ? currentProfile.displayNameEn || currentProfile.displayName
      : currentProfile.displayName.replace("นางสาว", "").trim();
  const programLabel = getProgramLabel(currentProfile.programName, language);
  const educationLevel = formData.educationLevel
    ? localizeStudentContent(formData.educationLevel, language)
    : "-";
  const bankLabel =
    language === "en"
      ? tempLoanFormOptions.banks.find((bank) => bank.value === formData.bankName)?.labelEn || formData.bankName
      : formData.bankName;
  const loanAmount = parseLoanAmount(formData.loanAmount);
  const installmentAmount = Math.floor(loanAmount / formData.installmentCount);
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
      amount: `${(
        installmentAmount +
        (index === formData.installmentCount - 1 ? installmentRemainder : 0)
      ).toLocaleString("th-TH")}`,
    };
  });

  const backdropDismiss = useModalDismiss({
    onClose,
    closeOnEscape: !isSubmitting,
  });

  if (errorDetails && errorDetails.status >= 500) {
    return (
      <div
        className={styles.loanApprovalModalBackdrop}
        onClick={onClose}
        role="presentation"
      >
        <section
          aria-labelledby="loan-server-error-title"
          aria-modal="true"
          className={styles.loanServerErrorModal}
          role="dialog"
        >
          <AlertCircle aria-hidden="true" className={styles.loanServerErrorIcon} size={44} />
          <h2 id="loan-server-error-title">{t("เกิดข้อผิดพลาดจากเซิร์ฟเวอร์", "A Server Error Occurred")}</h2>
          <p>
            {t(
              "ระบบเซิร์ฟเวอร์ขัดข้องชั่วคราว กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
              "The server is temporarily unavailable. Please wait a moment and try again.",
            )}
          </p>
          <button
            className={styles.loanServerErrorAction}
            onClick={(event) => {
              event.stopPropagation();
              onClose();
              router.push("/student");
            }}
            type="button"
          >
            {t("กลับไปยังหน้าหลัก", "Back to home")}
          </button>
        </section>
      </div>
    );
  }

  return (
    <div
      aria-label={t("ยืนยันข้อมูลการกู้ยืม", "Confirm Loan Information")}
      className={styles.loanApprovalModalBackdrop}
      {...backdropDismiss}
      role="presentation"
    >
      <section
        aria-labelledby="loan-approval-modal-title"
        className={styles.loanApprovalModal}
        role="dialog"
      >
        <button
          aria-label={t("ปิดหน้าต่างยืนยันข้อมูล", "Close confirmation window")}
          className="absolute right-5 top-4 z-10 rounded-full bg-gray-50 p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={20} />
        </button>

        <h2 id="loan-approval-modal-title">
          {isResubmit
            ? t("ยืนยันการแก้ไขข้อมูลการกู้ยืม", "Confirm Edited Loan Information")
            : t("ยืนยันข้อมูลการกู้ยืม", "Confirm Loan Information")}
        </h2>
        <p className={styles.loanApprovalWarning}>
          {t("กรุณาตรวจสอบข้อมูลทางการเงินให้ถูกต้อง", "Please verify your financial information.")}
          <br />
          {t(
            "หากข้อมูลผิดพลาดอาจทำให้คำร้องกู้ยืมเกิดความล่าช้า",
            "Incorrect details may delay your request.",
          )}
        </p>

        {errorDetails || errorMessage ? (
          <div
            role="alert"
            style={{
              color: "#b91c1c",
              backgroundColor: "#fef2f2",
              border: "1px solid #f87171",
              borderRadius: "0.5rem",
              padding: "0.75rem 1rem",
              margin: "0.5rem 0 1rem",
              fontSize: "0.875rem",
            }}
          >
            {errorDetails?.title ? (
              <strong style={{ display: "block", marginBottom: "0.25rem", fontWeight: 700 }}>
                {errorDetails.title}
              </strong>
            ) : null}
            <div>{errorDetails?.message || errorMessage}</div>
            {errorDetails?.action === "login" ? (
              <a
                href="/login"
                style={{
                  display: "inline-block",
                  marginTop: "0.5rem",
                  color: "#ffffff",
                  backgroundColor: "#b91c1c",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "0.375rem",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {t("เข้าสู่ระบบใหม่", "Log in again")}
              </a>
            ) : errorDetails?.action === "dashboard" ? (
              <a
                href="/student"
                style={{
                  display: "inline-block",
                  marginTop: "0.5rem",
                  color: "#ffffff",
                  backgroundColor: "#b91c1c",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "0.375rem",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {t("ไปที่หน้าหลัก", "Go to home")}
              </a>
            ) : null}
          </div>
        ) : null}

        <section className={styles.loanApprovalInfoCard}>
          <CardHeader
            className={styles.sectionCardHeading}
            icon={<UserRound aria-hidden="true" size={20} strokeWidth={2.2} />}
            title={t("ข้อมูลนักศึกษา", "Student Information")}
          />
          <dl>
            <div>
              <dt>{t("ชื่อ-นามสกุล", "Full name")}</dt>
              <dd>{studentName}</dd>
            </div>
            <div>
              <dt>{t("รหัสนักศึกษา", "Student ID")}</dt>
              <dd>{currentProfile.studentId}</dd>
            </div>
            <div>
              <dt>{t("หลักสูตร", "Program")}</dt>
              <dd>{programLabel || t("พยาบาลศาสตรบัณฑิต", "Bachelor of Nursing Science")}</dd>
            </div>
            <div>
              <dt>{t("วุฒิการศึกษา", "Education level")}</dt>
              <dd>{educationLevel}</dd>
            </div>
            <div>
              <dt>{t("ชั้นปีการศึกษา", "Academic year")}</dt>
              <dd>{t("ชั้นปีที่", "Year")} {formData.academicYear}</dd>
            </div>
            <div>
              <dt>{t("เบอร์โทรศัพท์", "Phone number")}</dt>
              <dd>{formData.phoneNumber || "-"}</dd>
            </div>
            <div>
              <dt>{t("อาจารย์ที่ปรึกษา", "Advisor")}</dt>
              <dd>{formData.advisorName || "-"}</dd>
            </div>
          </dl>
        </section>

        <section className={styles.loanApprovalInfoCard}>
          <CardHeader
            className={styles.sectionCardHeading}
            icon={<Landmark aria-hidden="true" size={20} strokeWidth={2.2} />}
            title={t("ข้อมูลธนาคาร", "Bank Information")}
          />
          <dl>
            <div>
              <dt>{t("ธนาคาร", "Bank")}</dt>
              <dd>{bankLabel || "-"}</dd>
            </div>
            <div>
              <dt>{t("เลขที่บัญชี", "Account number")}</dt>
              <dd>{formData.accountNumber || "-"}</dd>
            </div>
            <div>
              <dt>{t("ชื่อบัญชี", "Account name")}</dt>
              <dd>{formData.accountName || "-"}</dd>
            </div>
          </dl>
        </section>

        <section className={`${styles.loanApprovalInfoCard} ${styles.loanApprovalLoanInfoCard}`}>
          <CardHeader
            className={styles.sectionCardHeading}
            icon={<BahtCoinIcon aria-hidden="true" size={20} />}
            title={t("ข้อมูลการกู้ยืม", "Loan Information")}
          />
          <dl>
            <div>
              <dt>{t("วัตถุประสงค์การกู้ยืม", "Loan purpose")}</dt>
              <dd>{formData.purpose || "-"}</dd>
            </div>
            <div>
              <dt>{t("หมายเหตุเพิ่มเติม", "Additional note")}</dt>
              <dd>{formData.additionalNote || "-"}</dd>
            </div>
            <div className={styles.loanAmountRow}>
              <dt>{t("จำนวนเงินที่ขอกู้ยืม (บาท)", "Requested loan amount (baht)")}</dt>
              <dd>{formData.loanAmount || "0"}</dd>
            </div>
            <div>
              <dt>{t("จำนวนเงินตัวอักษร", "Amount in words")}</dt>
              <dd className={styles.loanAmountText}>
                {language === "en"
                  ? formatEnglishBahtText(formData.loanAmount || "0")
                  : formatThaiBahtText(formData.loanAmount || "0")}
              </dd>
            </div>
            <div className={styles.loanInstallmentRow}>
              <dt>{t("จำนวนงวดการชำระ", "Number of installments")}</dt>
              <dd>{formData.installmentCount} {t("งวด", "Inst.")}</dd>
            </div>
          </dl>

        </section>

        <LoanDetailSchedule iconSize={20} items={schedule} />

        <div className={styles.loanApprovalActions}>
          <button
            className={styles.loanApprovalCancel}
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            {t("ยกเลิก", "Cancel")}
          </button>
          <button
            className={styles.loanApprovalConfirm}
            disabled={isSubmitting}
            onClick={onConfirm}
            type="button"
          >
            {isSubmitting
              ? t("กำลังส่งคำร้อง...", "Submitting request...")
              : isResubmit
                ? t("ยืนยันการแก้ไขและยื่นคำร้อง", "Confirm edit and submit request")
                : t("ยืนยัน", "Confirm")}
          </button>
        </div>
      </section>
    </div>
  );
}
