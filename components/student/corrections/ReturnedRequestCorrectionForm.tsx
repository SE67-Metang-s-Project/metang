"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FilePenLine, UserRound, X } from "lucide-react";
import type { LoanInput } from "@/lib/loan-validation";
import LoanFormSelect from "@/components/student/application/LoanFormSelect";
import { formatThaiBahtText } from "@/app/student/studentFormatters";
import { studentProfile } from "@/app/student/studentMockData";
import { useStudentLanguage } from "@/app/student/StudentLanguageProvider";
import LoanDetailSchedule from "@/components/student/loan-details/LoanDetailSchedule";
import CardHeader from "@/components/shared/CardHeader";
import styles from "@/app/student/student.module.css";

export type AdvisorOption = {
  label: string;
  value: string;
};

export type ReturnedRequestCorrection = {
  advisorComment: string;
  advisorOptions: AdvisorOption[];
  educationLevel: string;
  id: string;
  input: LoanInput;
  phoneNumber: string;
  requestNumber: string;
};

export type ResubmitLoanRequest = (requestId: string, payload: LoanInput) => void | Promise<void>;

type CorrectionFormValues = Omit<LoanInput, "additionalNote" | "amount" | "studentYear"> & {
  additionalNote: string;
  amount: string;
  educationLevel: string;
  phoneNumber: string;
  studentYear: string;
};

type CorrectionField = keyof CorrectionFormValues;
type EditableTextField = Exclude<CorrectionField, "installmentCount">;
type CorrectionErrors = Partial<Record<CorrectionField, string>>;

type ReturnedRequestCorrectionFormProps = {
  correction: ReturnedRequestCorrection;
  onClose: () => void;
  onResubmit: ResubmitLoanRequest;
};

const requiredFieldMessage = "โปรดระบุข้อมูลในช่องนี้";
const correctionFields: EditableTextField[] = [
  "advisorName",
  "educationLevel",
  "studentYear",
  "phoneNumber",
  "bankName",
  "bankAccountNo",
  "bankAccountName",
  "purpose",
  "amount",
];

function getInitialValues(correction: ReturnedRequestCorrection): CorrectionFormValues {
  return {
    ...correction.input,
    additionalNote: correction.input.additionalNote ?? "",
    amount: String(correction.input.amount),
    educationLevel: correction.educationLevel,
    phoneNumber: correction.phoneNumber,
    studentYear: String(correction.input.studentYear),
  };
}

function validateField(field: EditableTextField, value: string) {
  const text = value.trim();

  if (field === "additionalNote") {
    return "";
  }

  if (!text) {
    return requiredFieldMessage;
  }

  if (field === "bankAccountNo" && !/^\d{10}$/.test(text)) {
    return "กรุณากรอกเลขที่บัญชีธนาคาร 10 หลัก";
  }

  if (field === "phoneNumber" && !/^\d{10}$/.test(text)) {
    return "กรุณากรอกเบอร์โทรศัพท์ 10 หลัก";
  }

  if (field === "amount" && (!/^\d+$/.test(text) || Number(text) <= 0)) {
    return "กรุณากรอกจำนวนเงินที่มากกว่า 0 บาท";
  }

  return "";
}

function getValidationErrors(values: CorrectionFormValues): CorrectionErrors {
  return correctionFields.reduce<CorrectionErrors>((errors, field) => {
    const error = validateField(field, values[field]);
    if (error) {
      errors[field] = error;
    }
    return errors;
  }, {});
}

export default function ReturnedRequestCorrectionForm({
  correction,
  onClose,
  onResubmit,
}: ReturnedRequestCorrectionFormProps) {
  const { t } = useStudentLanguage();
  const fieldRefs = useRef<Partial<Record<CorrectionField, HTMLLabelElement>>>({});
  const [values, setValues] = useState<CorrectionFormValues>(() => getInitialValues(correction));
  const [errors, setErrors] = useState<CorrectionErrors>({});
  const [touched, setTouched] = useState<Partial<Record<CorrectionField, boolean>>>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const updateField = (field: EditableTextField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (touched[field]) {
      setErrors((current) => ({ ...current, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (field: EditableTextField) => {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors((current) => ({ ...current, [field]: validateField(field, values[field]) }));
  };

  const handleReview = () => {
    const nextErrors = getValidationErrors(values);
    setErrors(nextErrors);
    setTouched(Object.fromEntries(correctionFields.map((field) => [field, true])));

    const firstInvalidField = correctionFields.find((field) => nextErrors[field]);
    if (firstInvalidField) {
      window.requestAnimationFrame(() => {
        const field = fieldRefs.current[firstInvalidField];
        field?.scrollIntoView({ behavior: "smooth", block: "center" });
        field?.querySelector<HTMLElement>("input, textarea, button")?.focus();
      });
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleResubmit = async () => {
    const payload: LoanInput = {
      advisorName: values.advisorName.trim(),
      amount: Number(values.amount),
      studentYear: Number(values.studentYear),
      purpose: values.purpose.trim(),
      additionalNote: values.additionalNote.trim() || null,
      bankName: values.bankName.trim(),
      bankAccountNo: values.bankAccountNo.trim(),
      bankAccountName: values.bankAccountName.trim(),
      installmentCount: values.installmentCount,
    };

    setIsSubmitting(true);
    setSubmitError("");
    try {
      await onResubmit(correction.id, payload);
    } catch {
      setSubmitError(t("ยังเตรียมข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง", "The request could not be prepared. Please try again."));
      setIsSubmitting(false);
    }
  };

  const handleBackdropMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const renderError = (field: EditableTextField) =>
    errors[field] ? <small className={styles.loanFormFieldError}>{errors[field]}</small> : null;

  const loanAmount = Number(values.amount) || 0;
  const installmentAmount = Math.floor(loanAmount / values.installmentCount);
  const installmentRemainder = loanAmount % values.installmentCount;
  const repaymentSchedule = Array.from({ length: values.installmentCount }, (_, index) => {
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
        (index === values.installmentCount - 1 ? installmentRemainder : 0)
      ).toLocaleString("th-TH")}`,
    };
  });

  return (
    <div
      aria-label={t("แก้ไขคำร้องกู้ยืม", "Correct loan request")}
      className={styles.returnedCorrectionBackdrop}
      onMouseDown={handleBackdropMouseDown}
      role="presentation"
    >
      <section
        aria-describedby="returned-request-advisor-comment"
        aria-labelledby="returned-request-correction-title"
        aria-modal="true"
        className={styles.returnedCorrectionModal}
        role="dialog"
      >
        <button
          aria-label={t("ปิดฟอร์มแก้ไขคำร้อง", "Close correction form")}
          className="absolute right-5 top-4 z-10 rounded-full bg-gray-50 p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          disabled={isSubmitting}
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={20} />
        </button>

        <header className={styles.returnedCorrectionHeading}>
          <FilePenLine aria-hidden="true" size={26} />
          <div>
            <p>{t("คำร้อง", "Request")} {correction.requestNumber}</p>
            <h2 id="returned-request-correction-title">
              {t("แก้ไขเอกสารและยื่นใหม่", "Correct documents and resubmit")}
            </h2>
          </div>
        </header>

        <section className={styles.returnedAdvisorComment} aria-labelledby="returned-request-comment-title">
          <AlertCircle aria-hidden="true" size={21} />
          <div>
            <h3 id="returned-request-comment-title">
              {t("ความคิดเห็นของอาจารย์ที่ปรึกษา", "Advisor's comment")}
            </h3>
            <p id="returned-request-advisor-comment">{correction.advisorComment}</p>
          </div>
        </section>

        <section className={styles.loanFormCard} aria-labelledby="returned-request-form-title">
          <h2 id="returned-request-form-title">
            {t("แก้ไขข้อมูลการกู้ยืม", "Correct loan details")}
          </h2>

          <section className={styles.loanFormStudentCard}>
            <CardHeader
              className={styles.sectionCardHeading}
              icon={<UserRound aria-hidden="true" size={20} strokeWidth={2.2} />}
              title={t("ข้อมูลนักศึกษา", "Student information")}
            />
            <div className={styles.loanFormStudentDetails}>
              <p>
                <span>{t("ชื่อ-นามสกุล", "Full name")}</span>
                <strong>{studentProfile.displayName.replace("นางสาว", "").trim()}</strong>
              </p>
              <p>
                <span>{t("รหัสนักศึกษา", "Student ID")}</span>
                <strong>{studentProfile.studentId}</strong>
              </p>
              <p>
                <span>{t("หลักสูตร", "Program")}</span>
                <strong>{studentProfile.programName}</strong>
              </p>
            </div>
          </section>

          <div className={styles.loanFormFields}>
            <label
              className={[styles.loanFormField, errors.educationLevel ? styles.loanFormFieldInvalid : ""]
                .filter(Boolean)
                .join(" ")}
              ref={(element) => {
                fieldRefs.current.educationLevel = element ?? undefined;
              }}
            >
              <span>{t("วุฒิการศึกษา", "Education level")}</span>
              <LoanFormSelect
                error={errors.educationLevel}
                onBlur={() => handleBlur("educationLevel")}
                onChange={(value) => updateField("educationLevel", value)}
                options={["ประกาศนียบัตรผู้ช่วยพยาบาล", "ปริญญาตรี", "ปริญญาโท", "ปริญญาเอก"].map((value) => ({
                  label: value,
                  value,
                }))}
                placeholder={t("เลือกวุฒิการศึกษา", "Select education level")}
                value={values.educationLevel}
              />
              {renderError("educationLevel")}
            </label>

            <label
              className={[styles.loanFormField, errors.studentYear ? styles.loanFormFieldInvalid : ""]
                .filter(Boolean)
                .join(" ")}
              ref={(element) => {
                fieldRefs.current.studentYear = element ?? undefined;
              }}
            >
              <span>{t("ชั้นปีการศึกษา", "Academic year")}</span>
              <LoanFormSelect
                error={errors.studentYear}
                onBlur={() => handleBlur("studentYear")}
                onChange={(value) => updateField("studentYear", value)}
                options={[1, 2, 3, 4].map((year) => ({ label: String(year), value: String(year) }))}
                placeholder={t("เลือกชั้นปี", "Select year")}
                value={values.studentYear}
              />
              {renderError("studentYear")}
            </label>

            <label
              className={[styles.loanFormField, errors.advisorName ? styles.loanFormFieldInvalid : ""]
                .filter(Boolean)
                .join(" ")}
              ref={(element) => {
                fieldRefs.current.advisorName = element ?? undefined;
              }}
            >
              <span>{t("อาจารย์ที่ปรึกษา", "Advisor")}</span>
              <LoanFormSelect
                error={errors.advisorName}
                onBlur={() => handleBlur("advisorName")}
                onChange={(value) => updateField("advisorName", value)}
                options={correction.advisorOptions}
                placeholder={t("เลือกอาจารย์ที่ปรึกษา", "Select an advisor")}
                value={values.advisorName}
              />
              <small className={styles.returnedCorrectionHint}>
                {t("เลือกอาจารย์เดิมได้ หรือเปลี่ยนอาจารย์ที่ปรึกษาก่อนยื่นใหม่", "Keep your current advisor or select a different advisor before resubmitting.")}
              </small>
              {renderError("advisorName")}
            </label>

            <label
              className={[styles.loanFormField, errors.phoneNumber ? styles.loanFormFieldInvalid : ""]
                .filter(Boolean)
                .join(" ")}
              ref={(element) => {
                fieldRefs.current.phoneNumber = element ?? undefined;
              }}
            >
              <span>{t("เบอร์โทรศัพท์", "Phone number")}</span>
              <input
                aria-invalid={Boolean(errors.phoneNumber)}
                inputMode="numeric"
                maxLength={10}
                onBlur={() => handleBlur("phoneNumber")}
                onChange={(event) => updateField("phoneNumber", event.target.value.replace(/\D/g, "").slice(0, 10))}
                type="text"
                value={values.phoneNumber}
              />
              {renderError("phoneNumber")}
            </label>

            <label
              className={[styles.loanFormField, errors.bankName ? styles.loanFormFieldInvalid : ""]
                .filter(Boolean)
                .join(" ")}
              ref={(element) => {
                fieldRefs.current.bankName = element ?? undefined;
              }}
            >
              <span>{t("ธนาคาร", "Bank")}</span>
              <input
                aria-invalid={Boolean(errors.bankName)}
                maxLength={200}
                onBlur={() => handleBlur("bankName")}
                onChange={(event) => updateField("bankName", event.target.value)}
                type="text"
                value={values.bankName}
              />
              {renderError("bankName")}
            </label>

            <label
              className={[styles.loanFormField, errors.bankAccountNo ? styles.loanFormFieldInvalid : ""]
                .filter(Boolean)
                .join(" ")}
              ref={(element) => {
                fieldRefs.current.bankAccountNo = element ?? undefined;
              }}
            >
              <span>{t("เลขที่บัญชีธนาคาร", "Bank account number")}</span>
              <input
                aria-invalid={Boolean(errors.bankAccountNo)}
                inputMode="numeric"
                maxLength={10}
                onBlur={() => handleBlur("bankAccountNo")}
                onChange={(event) => updateField("bankAccountNo", event.target.value.replace(/\D/g, "").slice(0, 10))}
                type="text"
                value={values.bankAccountNo}
              />
              {renderError("bankAccountNo")}
            </label>

            <label
              className={[styles.loanFormField, errors.bankAccountName ? styles.loanFormFieldInvalid : ""]
                .filter(Boolean)
                .join(" ")}
              ref={(element) => {
                fieldRefs.current.bankAccountName = element ?? undefined;
              }}
            >
              <span>{t("ชื่อบัญชีธนาคาร", "Bank account name")}</span>
              <input
                aria-invalid={Boolean(errors.bankAccountName)}
                maxLength={200}
                onBlur={() => handleBlur("bankAccountName")}
                onChange={(event) => updateField("bankAccountName", event.target.value)}
                type="text"
                value={values.bankAccountName}
              />
              {renderError("bankAccountName")}
            </label>

            <label
              className={[styles.loanFormField, errors.purpose ? styles.loanFormFieldInvalid : ""]
                .filter(Boolean)
                .join(" ")}
              ref={(element) => {
                fieldRefs.current.purpose = element ?? undefined;
              }}
            >
              <span>{t("วัตถุประสงค์การกู้ยืม", "Loan purpose")}</span>
              <input
                aria-invalid={Boolean(errors.purpose)}
                maxLength={2000}
                onBlur={() => handleBlur("purpose")}
                onChange={(event) => updateField("purpose", event.target.value)}
                type="text"
                value={values.purpose}
              />
              {renderError("purpose")}
            </label>

            <label className={styles.loanFormField}>
              <span>{t("หมายเหตุเพิ่มเติม", "Additional note")}</span>
              <textarea
                maxLength={2000}
                onChange={(event) => updateField("additionalNote", event.target.value)}
                value={values.additionalNote}
              />
            </label>

            <label
              className={[styles.loanFormField, errors.amount ? styles.loanFormFieldInvalid : ""]
                .filter(Boolean)
                .join(" ")}
              ref={(element) => {
                fieldRefs.current.amount = element ?? undefined;
              }}
            >
              <span>{t("จำนวนเงินที่ขอกู้ยืม (บาท)", "Requested amount (THB)")}</span>
              <input
                aria-invalid={Boolean(errors.amount)}
                inputMode="numeric"
                onBlur={() => handleBlur("amount")}
                onChange={(event) => updateField("amount", event.target.value.replace(/\D/g, ""))}
                pattern="[0-9]*"
                type="text"
                value={values.amount}
              />
              {values.amount ? <p className={styles.loanAmountText}>{formatThaiBahtText(values.amount)}</p> : null}
              {renderError("amount")}
            </label>

            <fieldset className={styles.loanInstallmentField}>
              <legend>{t("จำนวนงวดการชำระ", "Number of installments")}</legend>
              <div className={styles.loanInstallmentOptions}>
                {[1, 2, 3].map((count) => (
                  <button
                    className={values.installmentCount === count ? styles.loanInstallmentSelected : ""}
                    key={count}
                    onClick={() => setValues((current) => ({ ...current, installmentCount: count }))}
                    type="button"
                  >
                    {count} {t("งวด", "installment")}
                  </button>
                ))}
              </div>
              <LoanDetailSchedule items={repaymentSchedule} />
            </fieldset>
          </div>
        </section>

        {submitError ? <p className={styles.returnedCorrectionSubmitError}>{submitError}</p> : null}

        <footer className={styles.returnedCorrectionActions}>
          <button className={styles.loanFormBack} disabled={isSubmitting} onClick={onClose} type="button">
            {t("ยกเลิก", "Cancel")}
          </button>
          <button className={styles.loanApplicationNext} disabled={isSubmitting} onClick={handleReview} type="button">
            {t("ตรวจสอบก่อนยื่นใหม่", "Review before resubmitting")}
          </button>
        </footer>

        {isConfirmOpen ? (
          <div className={styles.returnedCorrectionConfirmationBackdrop} role="presentation">
            <section
              aria-labelledby="returned-request-confirmation-title"
              aria-modal="true"
              className={styles.returnedCorrectionConfirmation}
              role="dialog"
            >
              <CheckCircle2 aria-hidden="true" size={42} />
              <h2 id="returned-request-confirmation-title">
                {t("ยืนยันการยื่นคำร้องอีกครั้ง", "Confirm resubmission")}
              </h2>
              <p>
                {t("คำร้องจะส่งพร้อมข้อมูลที่แก้ไขแล้วให้อาจารย์ที่ปรึกษา", "The corrected request will be sent to the selected advisor.")}
              </p>
              <dl>
                <div>
                  <dt>{t("อาจารย์ที่ปรึกษา", "Advisor")}</dt>
                  <dd>{values.advisorName}</dd>
                </div>
                <div>
                  <dt>{t("จำนวนเงิน", "Amount")}</dt>
                  <dd>{Number(values.amount).toLocaleString("th-TH")} {t("บาท", "THB")}</dd>
                </div>
              </dl>
              <div className={styles.returnedCorrectionActions}>
                <button className={styles.loanFormBack} disabled={isSubmitting} onClick={() => setIsConfirmOpen(false)} type="button">
                  {t("กลับไปแก้ไข", "Back to edit")}
                </button>
                <button className={styles.loanApplicationNext} disabled={isSubmitting} onClick={handleResubmit} type="button">
                  {isSubmitting ? t("กำลังเตรียมข้อมูล…", "Preparing…") : t("ยืนยันและยื่นใหม่", "Confirm and resubmit")}
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </div>
  );
}
