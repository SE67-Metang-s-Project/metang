"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { House, UserRound } from "lucide-react";
import {
  tempLoanAgreement,
  tempLoanFormDefaults,
  tempLoanFormOptions,
  tempStudentProfile,
  type TempLoanFormData,
} from "@/app/student/temp/tempMockData";
import { saveStudentEducationLevel, useStudentEducationLevel } from "@/lib/student-education";
import { formatThaiBahtText } from "@/app/student/studentFormatters";
import TempLoanApprovalModal from "./TempLoanApprovalModal";
import TempLoanDetailsStep from "./TempLoanDetailsStep";
import LoanFormSelect from "./LoanFormSelect";
import LoanDetailSchedule from "../loan-details/LoanDetailSchedule";
import TopNav from "@/components/shared/TopNav";
import CardHeader from "@/components/shared/CardHeader";
import styles from "@/app/student/student.module.css";

type FormField = Exclude<keyof TempLoanFormData, "installmentCount">;
type RequiredFormField = Exclude<FormField, "additionalNote">;
type FormErrors = Partial<Record<RequiredFormField, string>>;

const requiredFieldMessage = "โปรดระบุข้อมูลในช่องนี้";
const requiredFormFields: RequiredFormField[] = [
  "educationLevel",
  "academicYear",
  "advisorName",
  "phoneNumber",
  "bankName",
  "accountNumber",
  "accountName",
  "purpose",
  "loanAmount",
];

const validateField = (field: RequiredFormField, value: string) => {
  if (field === "phoneNumber" && !/^\d{10}$/.test(value)) {
    return "กรุณากรอกเบอร์โทรศัพท์ 10 หลัก";
  }

  if (field === "accountNumber" && !/^\d{10}$/.test(value)) {
    return "กรุณากรอกเลขที่บัญชีธนาคาร 10 หลัก";
  }

  if (!value.trim()) {
    return requiredFieldMessage;
  }

  return "";
};

export default function TempLoanApplicationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fieldRefs = useRef<Partial<Record<RequiredFormField, HTMLLabelElement>>>({});
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(
    searchParams.get("step") === "3" ? 3 : 1,
  );
  const [hasReadAgreement, setHasReadAgreement] = useState(false);
  const [hasAcceptedAgreement, setHasAcceptedAgreement] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [formData, setFormData] = useState(tempLoanFormDefaults);
  const savedEducationLevel = useStudentEducationLevel();
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<RequiredFormField, boolean>>
  >({});
  const savedFormData = {
    ...formData,
    educationLevel: savedEducationLevel ?? formData.educationLevel,
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [currentStep]);

  useEffect(() => {
    if (currentStep !== 1) {
      return;
    }

    const markAgreementAsReadAtPageEnd = () => {
      const pageHeight = document.documentElement.scrollHeight;
      const pageBottom = window.scrollY + window.innerHeight;

      if (pageBottom >= pageHeight - 8) {
        setHasReadAgreement(true);
      }
    };

    window.addEventListener("scroll", markAgreementAsReadAtPageEnd, { passive: true });
    window.requestAnimationFrame(markAgreementAsReadAtPageEnd);

    return () => window.removeEventListener("scroll", markAgreementAsReadAtPageEnd);
  }, [currentStep]);

  const updateFormField = (field: FormField, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    if (field === "educationLevel") {
      saveStudentEducationLevel(value);
    }
    if (field !== "additionalNote" && touchedFields[field]) {
      setFormErrors((current) => ({ ...current, [field]: validateField(field, value) }));
    }
  };

  const validateLoanForm = () => {
    return requiredFormFields.reduce<FormErrors>((errors, field) => {
      const error = validateField(field, savedFormData[field]);

      if (error) {
        errors[field] = error;
      }

      return errors;
    }, {});
  };

  const handleFieldBlur = (field: RequiredFormField) => {
    setTouchedFields((current) => ({ ...current, [field]: true }));
    setFormErrors((current) => ({
      ...current,
      [field]: validateField(field, formData[field]),
    }));
  };

  const handleLoanFormNext = () => {
    const errors = validateLoanForm();
    setTouchedFields({
      educationLevel: true,
      academicYear: true,
      advisorName: true,
      phoneNumber: true,
      bankName: true,
      accountNumber: true,
      accountName: true,
      purpose: true,
      loanAmount: true,
    });
    setFormErrors(errors);

    const firstInvalidField = requiredFormFields.find((field) => errors[field]);

    if (firstInvalidField) {
      window.requestAnimationFrame(() => {
        const field = fieldRefs.current[firstInvalidField];
        field?.scrollIntoView({ behavior: "smooth", block: "center" });
        field?.querySelector<HTMLElement>("input, select, button")?.focus();
      });
    } else {
      setIsApprovalModalOpen(true);
    }
  };

  const loanAmount = Number(formData.loanAmount) || 0;
  const installmentAmount = Math.floor(loanAmount / formData.installmentCount);
  const installmentRemainder = loanAmount % formData.installmentCount;
  const repaymentSchedule = Array.from({ length: formData.installmentCount }, (_, index) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30 * (index + 1));

    return {
      installmentNumber: index + 1,
      dueDateLabel: `ครบกำหนด ${dueDate.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`,
      amount: `${(installmentAmount + (index === formData.installmentCount - 1 ? installmentRemainder : 0)).toLocaleString("th-TH")}`,
    };
  });

  const stepClassName = (step: 1 | 2 | 3) => {
    if (step < currentStep) {
      return styles.applicationStepComplete;
    }

    return step === currentStep ? styles.applicationStepActive : "";
  };

  return (
    <main className={styles.studentPage}>
      <TopNav
        showSidebarButton={false}
        userEmail={`${tempStudentProfile.studentId}@cmu.ac.th`}
        userId={tempStudentProfile.studentId}
        userName={tempStudentProfile.displayName}
        userRole="นักศึกษา"
      />
      <div className={styles.studentPageContent}>
        <div className={styles.loanApplicationPage}>
        <h1 className={styles.loanApplicationTitle}>ยื่นคำร้องกู้ยืม</h1>

        <ol className={styles.applicationStepper} aria-label="ขั้นตอนการยื่นคำร้องกู้ยืม">
          <li className={stepClassName(1)}>
            <span>1</span>
          </li>
          <li className={stepClassName(2)}>
            <span>2</span>
          </li>
          <li className={stepClassName(3)}>
            <span>3</span>
          </li>
        </ol>

        {currentStep === 1 ? (
          <section className={styles.loanAgreementCard} aria-labelledby="agreement-title">
            <header className={styles.sectionCardHeading}>
              <h2 id="agreement-title">ขั้นตอนที่ 1: ยืนยันข้อตกลงการกู้ยืม</h2>
            </header>

            <div className={styles.loanAgreementScroll}>
              <h3>{tempLoanAgreement.title}</h3>
              <h3>{tempLoanAgreement.organization}</h3>
              <p>{tempLoanAgreement.introduction}</p>
              {tempLoanAgreement.sections.map((section) => (
                <section key={section.title}>
                  <h4>{section.title}</h4>
                  <p>{section.body}</p>
                </section>
              ))}
            </div>

            <label
              className={[
                styles.loanAgreementAcceptance,
                !hasReadAgreement ? styles.loanAgreementAcceptanceDisabled : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <input
                checked={hasAcceptedAgreement}
                disabled={!hasReadAgreement}
                onChange={(event) => setHasAcceptedAgreement(event.target.checked)}
                type="checkbox"
              />
              <span>{tempLoanAgreement.acceptanceLabel}</span>
            </label>
          </section>
        ) : currentStep === 2 ? (
          <section className={styles.loanFormCard} aria-labelledby="loan-form-title">
            <h2 id="loan-form-title">ขั้นตอนที่ 2: กรอกข้อมูลการกู้ยืม</h2>

            <section className={styles.loanFormStudentCard}>
              <CardHeader
                className={styles.sectionCardHeading}
                icon={<UserRound aria-hidden="true" size={20} strokeWidth={2.2} />}
                title="ข้อมูลนักศึกษา"
              />
              <div className={styles.loanFormStudentDetails}>
                <p>
                  <span>ชื่อ-นามสกุล</span>
                  <strong>{tempStudentProfile.displayName.replace("นางสาว", "").trim()}</strong>
                </p>
                <p>
                  <span>รหัสนักศึกษา</span>
                  <strong>{tempStudentProfile.studentId}</strong>
                </p>
                <p>
                  <span>หลักสูตร</span>
                  <strong>{tempStudentProfile.programName}</strong>
                </p>
              </div>
            </section>

            <div className={styles.loanFormFields}>
              <label
                className={[
                  styles.loanFormField,
                  formErrors.educationLevel ? styles.loanFormFieldInvalid : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                ref={(element) => {
                  fieldRefs.current.educationLevel = element ?? undefined;
                }}
              >
                <span>วุฒิการศึกษา</span>
                <LoanFormSelect
                  error={formErrors.educationLevel}
                  onBlur={() => handleFieldBlur("educationLevel")}
                  onChange={(value) => updateFormField("educationLevel", value)}
                  options={tempLoanFormOptions.educationLevels}
                  placeholder="เลือกวุฒิการศึกษา"
                  value={savedEducationLevel ?? formData.educationLevel}
                />
                {/* <small>
                  {savedEducationLevel
                    ? "วุฒิการศึกษาถูกบันทึกแล้วและไม่สามารถแก้ไขได้"
                    : "เลือกครั้งเดียวตอนกู้ยืมครั้งแรกเท่านั้น การกู้ยืมครั้งถัดไปจะแสดงข้อมูลเดิม"}
                </small> */}
                {formErrors.educationLevel ? (
                  <small className={styles.loanFormFieldError}>
                    {formErrors.educationLevel}
                  </small>
                ) : null}
              </label>

              <label
                className={[styles.loanFormField, formErrors.academicYear ? styles.loanFormFieldInvalid : ""]
                  .filter(Boolean)
                  .join(" ")}
                ref={(element) => {
                  fieldRefs.current.academicYear = element ?? undefined;
                }}
              >
                <span>ชั้นปีการศึกษา</span>
                <LoanFormSelect
                  error={formErrors.academicYear}
                  onBlur={() => handleFieldBlur("academicYear")}
                  onChange={(value) => updateFormField("academicYear", value)}
                  options={tempLoanFormOptions.academicYears}
                  placeholder="เลือกชั้นปีการศึกษา"
                  value={formData.academicYear}
                />
                {formErrors.academicYear ? (
                  <small className={styles.loanFormFieldError}>{formErrors.academicYear}</small>
                ) : null}
              </label>

              <label
                className={[styles.loanFormField, formErrors.advisorName ? styles.loanFormFieldInvalid : ""]
                  .filter(Boolean)
                  .join(" ")}
                ref={(element) => {
                  fieldRefs.current.advisorName = element ?? undefined;
                }}
              >
                <span>อาจารย์ที่ปรึกษา</span>
                <LoanFormSelect
                  error={formErrors.advisorName}
                  onBlur={() => handleFieldBlur("advisorName")}
                  onChange={(value) => updateFormField("advisorName", value)}
                  options={tempLoanFormOptions.advisors}
                  placeholder="เลือกอาจารย์ที่ปรึกษา"
                  value={formData.advisorName}
                />
                {formErrors.advisorName ? (
                  <small className={styles.loanFormFieldError}>{formErrors.advisorName}</small>
                ) : null}
              </label>

              <label
                className={[styles.loanFormField, formErrors.phoneNumber ? styles.loanFormFieldInvalid : ""]
                  .filter(Boolean)
                  .join(" ")}
                ref={(element) => {
                  fieldRefs.current.phoneNumber = element ?? undefined;
                }}
              >
                <span>เบอร์โทรศัพท์</span>
                <input
                  aria-invalid={Boolean(formErrors.phoneNumber)}
                  inputMode="numeric"
                  maxLength={10}
                  onBlur={() => handleFieldBlur("phoneNumber")}
                  onChange={(event) =>
                    updateFormField("phoneNumber", event.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="กรอกเบอร์โทรศัพท์"
                  type="text"
                  value={formData.phoneNumber}
                />
                {formErrors.phoneNumber ? (
                  <small className={styles.loanFormFieldError}>{formErrors.phoneNumber}</small>
                ) : null}
              </label>

              <label
                className={[styles.loanFormField, formErrors.bankName ? styles.loanFormFieldInvalid : ""]
                  .filter(Boolean)
                  .join(" ")}
                ref={(element) => {
                  fieldRefs.current.bankName = element ?? undefined;
                }}
              >
                <span>ธนาคาร</span>
                <LoanFormSelect
                  error={formErrors.bankName}
                  onBlur={() => handleFieldBlur("bankName")}
                  onChange={(value) => updateFormField("bankName", value)}
                  options={tempLoanFormOptions.banks}
                  placeholder="เลือกธนาคาร"
                  value={formData.bankName}
                />
                {formErrors.bankName ? (
                  <small className={styles.loanFormFieldError}>{formErrors.bankName}</small>
                ) : null}
              </label>

              <label
                className={[styles.loanFormField, formErrors.accountNumber ? styles.loanFormFieldInvalid : ""]
                  .filter(Boolean)
                  .join(" ")}
                ref={(element) => {
                  fieldRefs.current.accountNumber = element ?? undefined;
                }}
              >
                <span>เลขที่บัญชีธนาคาร</span>
                <input
                  aria-invalid={Boolean(formErrors.accountNumber)}
                  inputMode="numeric"
                  maxLength={10}
                  onBlur={() => handleFieldBlur("accountNumber")}
                  onChange={(event) =>
                    updateFormField("accountNumber", event.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="กรอกเลขที่บัญชี"
                  type="text"
                  value={formData.accountNumber}
                />
                {formErrors.accountNumber ? (
                  <small className={styles.loanFormFieldError}>{formErrors.accountNumber}</small>
                ) : null}
              </label>

              <label
                className={[styles.loanFormField, formErrors.accountName ? styles.loanFormFieldInvalid : ""]
                  .filter(Boolean)
                  .join(" ")}
                ref={(element) => {
                  fieldRefs.current.accountName = element ?? undefined;
                }}
              >
                <span>ชื่อบัญชีธนาคาร</span>
                <input
                  aria-invalid={Boolean(formErrors.accountName)}
                  onBlur={() => handleFieldBlur("accountName")}
                  onChange={(event) => updateFormField("accountName", event.target.value)}
                  placeholder="กรอกชื่อบัญชี"
                  type="text"
                  value={formData.accountName}
                />
                {formErrors.accountName ? (
                  <small className={styles.loanFormFieldError}>{formErrors.accountName}</small>
                ) : null}
              </label>

              <label
                className={[styles.loanFormField, formErrors.purpose ? styles.loanFormFieldInvalid : ""]
                  .filter(Boolean)
                  .join(" ")}
                ref={(element) => {
                  fieldRefs.current.purpose = element ?? undefined;
                }}
              >
                <span>วัตถุประสงค์การกู้ยืม</span>
                <input
                  aria-invalid={Boolean(formErrors.purpose)}
                  maxLength={40}
                  onBlur={() => handleFieldBlur("purpose")}
                  onChange={(event) => updateFormField("purpose", event.target.value)}
                  placeholder="กรอกวัตถุประสงค์"
                  type="text"
                  value={formData.purpose}
                />
                {formErrors.purpose ? (
                  <small className={styles.loanFormFieldError}>{formErrors.purpose}</small>
                ) : null}
              </label>

              <label className={styles.loanFormField}>
                <span>หมายเหตุเพิ่มเติม</span>
                <textarea
                  onChange={(event) => updateFormField("additionalNote", event.target.value)}
                  placeholder="กรอกหมายเหตุเพิ่มเติม"
                  value={formData.additionalNote === "-" ? "" : formData.additionalNote}
                />
              </label>

              <label
                className={[styles.loanFormField, formErrors.loanAmount ? styles.loanFormFieldInvalid : ""]
                  .filter(Boolean)
                  .join(" ")}
                ref={(element) => {
                  fieldRefs.current.loanAmount = element ?? undefined;
                }}
              >
                <span>จำนวนเงินที่ขอกู้ยืม (บาท)</span>
                <input
                  aria-invalid={Boolean(formErrors.loanAmount)}
                  inputMode="numeric"
                  onBlur={() => handleFieldBlur("loanAmount")}
                  onChange={(event) =>
                    updateFormField("loanAmount", event.target.value.replace(/\D/g, ""))
                  }
                  pattern="[0-9]*"
                  type="text"
                  value={formData.loanAmount}
                />
                {formData.loanAmount ? (
                  <p className={styles.loanAmountText}>{formatThaiBahtText(formData.loanAmount)}</p>
                ) : null}
                {formErrors.loanAmount ? (
                  <small className={styles.loanFormFieldError}>{formErrors.loanAmount}</small>
                ) : null}
              </label>

              <fieldset className={styles.loanInstallmentField}>
                <legend>จำนวนงวดการชำระ</legend>
                <div className={styles.loanInstallmentOptions}>
                  {[1, 2, 3].map((count) => (
                    <button
                      className={
                        formData.installmentCount === count
                          ? styles.loanInstallmentSelected
                          : ""
                      }
                      key={count}
                      onClick={() =>
                        setFormData((current) => ({
                          ...current,
                          installmentCount: count,
                        }))
                      }
                      type="button"
                    >
                      {count} งวด
                    </button>
                  ))}
                </div>
                <LoanDetailSchedule items={repaymentSchedule} />
              </fieldset>
            </div>
          </section>
        ) : (
          <TempLoanDetailsStep formData={savedFormData} />
        )}

        {currentStep === 1 ? (
          <div className={styles.loanFormActions}>
            <button
              className={styles.loanApplicationHomeButton}
              onClick={() => router.push("/student/loan")}
              type="button"
            >
              <House aria-hidden="true" size={19} strokeWidth={2.2} />
              กลับหน้าหลัก
            </button>
            <button
              className={styles.loanApplicationNext}
              disabled={!hasReadAgreement || !hasAcceptedAgreement}
              onClick={() => setCurrentStep(2)}
              type="button"
            >
              ถัดไป
            </button>
          </div>
        ) : currentStep === 2 ? (
          <div className={styles.loanFormActions}>
            <button
              className={styles.loanFormBack}
              onClick={() => setCurrentStep(1)}
              type="button"
            >
              ย้อนกลับ
            </button>
            <button
              className={styles.loanApplicationNext}
              onClick={handleLoanFormNext}
              type="button"
            >
              ถัดไป
            </button>
          </div>
        ) : (
          <div className={styles.loanFormActions}>
            <button
              className={styles.loanFormBack}
              onClick={() => setCurrentStep(2)}
              type="button"
            >
              กลับไปแก้ไขข้อมูล
            </button>
            <button
              className={styles.loanApplicationDashboardButton}
              onClick={() => router.push("/student/loan")}
              type="button"
            >
              <House aria-hidden="true" size={19} strokeWidth={2.2} />
              กลับหน้าหลัก
            </button>
          </div>
        )}
        </div>
      </div>

      {isApprovalModalOpen ? (
        <TempLoanApprovalModal
          formData={savedFormData}
          onClose={() => setIsApprovalModalOpen(false)}
          onConfirm={() => {
            if (!savedEducationLevel) {
              saveStudentEducationLevel(formData.educationLevel);
            }
            setIsApprovalModalOpen(false);
            setCurrentStep(3);
          }}
        />
      ) : null}
    </main>
  );
}
