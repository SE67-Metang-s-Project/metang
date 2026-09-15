"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ClipboardList,
  FileClock,
  House,
  Landmark,
  RotateCcw,
  UserRound,
} from "lucide-react";
import {
  tempLoanAgreement,
  tempLoanAgreementEn,
  tempLoanApplicationLimit,
  tempLoanFormDefaults,
  tempLoanFormOptions,
  tempStudentProfile,
  type TempLoanFormData,
} from "@/app/student/temp/tempMockData";
import { localizeStudentContent, useStudentLanguage } from "@/app/student/StudentLanguageProvider";
import { saveStudentEducationLevel } from "@/lib/student-education";
import {
  getSavedStudentApplicationProfile,
  saveStudentApplicationProfile,
} from "@/lib/student-application-profile";
import {
  formatEnglishBahtText,
  formatLoanAmountInput,
  formatThaiBahtText,
  parseLoanAmount,
} from "@/app/student/studentFormatters";
import TempLoanApprovalModal from "./TempLoanApprovalModal";
import TempLoanDetailsStep from "./TempLoanDetailsStep";
import LoanFormSelect from "./LoanFormSelect";
import LoanDetailSchedule from "../loan-details/LoanDetailSchedule";
import StudentTopNav from "@/components/student/StudentTopNav";
import CardHeader from "@/components/shared/CardHeader";
import BahtCoinIcon from "@/components/shared/BahtCoinIcon";
import styles from "@/app/student/student.module.css";
import {
  mapStudentApiError,
  mapNetworkError,
  type StudentUiError,
} from "@/lib/student-error-mapper";

import type { StudentProfileDisplay } from "../dashboard/LoanSummaryCard";
import type { RawStudentLoan } from "@/lib/student-view-model";

type FormField = Exclude<keyof TempLoanFormData, "installmentCount">;
type RequiredFormField = Exclude<FormField, "additionalNote">;
type FormErrors = Partial<Record<RequiredFormField, string>>;

const educationLevelsByStudentIdDigit: Record<string, string> = {
  "0": "ประกาศนียบัตรบัณฑิต",
  "1": "ปริญญาตรี",
  "3": "ปริญญาโท",
  "5": "ปริญญาเอก",
};

const getEducationLevelFromStudentId = (studentId: string) =>
  educationLevelsByStudentIdDigit[studentId.charAt(4)] ?? "";

const getProgramLabel = (programName: string | undefined, language: "th" | "en") => {
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
};

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

const validateField = (field: RequiredFormField, value: string, language: "th" | "en") => {
  if (field === "phoneNumber") {
    const cleaned = value.trim().replace(/[-\s]/g, "");
    if (!/^0(?:[689]\d{8}|[23457]\d{7})$/.test(cleaned)) {
      return language === "en"
        ? "Please enter a valid phone number (10-digit mobile or 9-digit landline)."
        : "กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (เบอร์มือถือ 10 หลัก หรือเบอร์บ้าน 9 หลัก)";
    }
  }

  if (field === "accountNumber" && !/^\d{10}$/.test(value)) {
    return language === "en"
      ? "Please enter a 10-digit bank account number."
      : "กรุณากรอกเลขที่บัญชีธนาคาร 10 หลัก";
  }

  if (field === "loanAmount") {
    const amount = Number(value.replace(/,/g, ""));
    if (!value.trim() || isNaN(amount) || amount <= 0) {
      return language === "en" ? "Please enter a valid amount." : "กรุณากรอกจำนวนเงินที่ถูกต้อง";
    }
    if (amount > tempLoanApplicationLimit) {
      return language === "en"
        ? "Amount exceeds the limit. Please enter a new amount."
        : "จำนวนเงินเกินวงเงินที่กำหนด กรุณากรอกจำนวนเงินใหม่";
    }
  }

  if (!value.trim()) {
    return language === "en" ? "Please fill out this field." : "โปรดระบุข้อมูลในช่องนี้";
  }

  return "";
};

export type ExistingLoanData = {
  id: string;
  status: string;
  amount?: number;
  studentYear?: number;
  purpose?: string;
  additionalNote?: string | null;
  bankName?: string | null;
  bankAccountNo?: string | null;
  bankAccountName?: string | null;
  installmentCount?: number;
  advisorName?: string;
  returnComment?: string;
  returnStep?: string;
};

type TempLoanApplicationPageProps = {
  profile?: StudentProfileDisplay & { phoneNumber?: string };
  advisorOptions?: string[];
  existingLoan?: ExistingLoanData | null;
};

export default function TempLoanApplicationPage({
  profile: initialProfile,
  advisorOptions,
  existingLoan,
}: TempLoanApplicationPageProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useStudentLanguage();
  const loanAgreement = language === "en" ? tempLoanAgreementEn : tempLoanAgreement;
  const isResubmit = existingLoan?.status === "returned";
  const fieldRefs = useRef<Partial<Record<RequiredFormField, HTMLLabelElement>>>({});
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(
    searchParams.get("step") === "3" ? 3 : isResubmit ? 2 : 1,
  );
  const [hasReadAgreement, setHasReadAgreement] = useState(Boolean(isResubmit));
  const [hasAcceptedAgreement, setHasAcceptedAgreement] = useState(Boolean(isResubmit));
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitErrorDetails, setSubmitErrorDetails] = useState<StudentUiError | null>(null);
  const [createdLoanData, setCreatedLoanData] = useState<RawStudentLoan | null>(null);

  const [profile] = useState<StudentProfileDisplay & { phoneNumber?: string }>(
    initialProfile ?? tempStudentProfile,
  );
  const educationLevel = profile.educationLevel || getEducationLevelFromStudentId(profile.studentId);
  const isGraduateDiploma = educationLevel === "ประกาศนียบัตรบัณฑิต";
  const studentName =
    language === "en"
      ? profile.displayNameEn || profile.displayName
      : profile.displayName.replace("นางสาว", "").trim();
  const programLabel = getProgramLabel(profile.programName, language);
  const educationLevelLabel = educationLevel
    ? localizeStudentContent(educationLevel, language)
    : t("ไม่พบข้อมูลวุฒิการศึกษา", "Education level not found");

  const [advisors, setAdvisors] = useState<string[]>(advisorOptions ?? []);

  useEffect(() => {
    if (advisorOptions && advisorOptions.length > 0) return;
    let isMounted = true;
    fetch("/api/student/advisors")
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.data && Array.isArray(json.data)) {
          const names = json.data
            .map((a: { fullNameTh?: string }) => a.fullNameTh)
            .filter((name: unknown): name is string => typeof name === "string" && Boolean(name));
          if (names.length > 0) {
            setAdvisors(names);
          }
        }
      })
      .catch((err) => console.error("Could not fetch advisors", err));
    return () => {
      isMounted = false;
    };
  }, [advisorOptions]);

  const [formData, setFormData] = useState(() => {
    const savedProfile = getSavedStudentApplicationProfile();
    if (isResubmit && existingLoan) {
      return {
        ...tempLoanFormDefaults,
        phoneNumber: initialProfile?.phoneNumber || tempLoanFormDefaults.phoneNumber,
        educationLevel: educationLevel || tempLoanFormDefaults.educationLevel,
        academicYear: isGraduateDiploma
          ? "1"
          : String(existingLoan.studentYear ?? tempLoanFormDefaults.academicYear),
        advisorName: existingLoan.advisorName || tempLoanFormDefaults.advisorName,
        bankName: existingLoan.bankName || tempLoanFormDefaults.bankName,
        accountNumber: existingLoan.bankAccountNo || tempLoanFormDefaults.accountNumber,
        accountName: existingLoan.bankAccountName || tempLoanFormDefaults.accountName,
        purpose: existingLoan.purpose || tempLoanFormDefaults.purpose,
        additionalNote: existingLoan.additionalNote || "",
        loanAmount: existingLoan.amount
          ? String(existingLoan.amount)
          : tempLoanFormDefaults.loanAmount,
        installmentCount: (existingLoan.installmentCount as 1 | 2 | 3 | 4) || 1,
      };
    }

    return {
      ...tempLoanFormDefaults,
      phoneNumber: savedProfile.phoneNumber || tempLoanFormDefaults.phoneNumber,
      educationLevel: educationLevel || tempLoanFormDefaults.educationLevel,
      academicYear: isGraduateDiploma
        ? "1"
        : savedProfile.academicYear || tempLoanFormDefaults.academicYear,
      advisorName: savedProfile.advisorName || tempLoanFormDefaults.advisorName,
    };
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Partial<Record<RequiredFormField, boolean>>>(
    {},
  );
  const savedFormData = {
    ...formData,
    educationLevel,
  };

  useEffect(() => {
    if (educationLevel) {
      saveStudentEducationLevel(educationLevel);
    }
  }, [educationLevel]);

  useEffect(() => {
    if (isResubmit) return;

    saveStudentApplicationProfile({
      academicYear: formData.academicYear,
      advisorName: formData.advisorName,
      educationLevel: formData.educationLevel,
      phoneNumber: formData.phoneNumber,
    });
  }, [
    formData.academicYear,
    formData.advisorName,
    formData.educationLevel,
    formData.phoneNumber,
    isResubmit,
  ]);

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
    if (field === "loanAmount" || (field !== "additionalNote" && touchedFields[field])) {
      setFormErrors((current) => ({ ...current, [field]: validateField(field, value, language) }));
    }
  };

  const handleLoanAmountChange = (value: string) => {
    const formattedAmount = formatLoanAmountInput(value);

    if (parseLoanAmount(formattedAmount) > tempLoanApplicationLimit) {
      setFormErrors((current) => ({ ...current, loanAmount: "" }));
      return;
    }

    updateFormField("loanAmount", formattedAmount);
  };

  const validateLoanForm = () => {
    return requiredFormFields.reduce<FormErrors>((errors, field) => {
      const error = validateField(field, savedFormData[field], language);

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
      [field]: validateField(field, formData[field], language),
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

  const loanAmount = parseLoanAmount(formData.loanAmount);
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

  const handleConfirmSubmission = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const cleanedPhone = formData.phoneNumber.trim().replace(/[-\s]/g, "");
      if (cleanedPhone && /^0(?:[689]\d{8}|[23457]\d{7})$/.test(cleanedPhone)) {
        try {
          await fetch("/api/student/phone-number", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phoneNumber: cleanedPhone }),
          });
        } catch (err) {
          console.warn("Could not sync phone number", err);
        }
      }

      const payload = {
        advisorName: formData.advisorName,
        amount: Number(formData.loanAmount.replace(/,/g, "")),
        studentYear: Number(formData.academicYear),
        purpose: formData.purpose,
        additionalNote:
          formData.additionalNote === "-" || !formData.additionalNote.trim()
            ? null
            : formData.additionalNote.trim(),
        bankName: formData.bankName,
        bankAccountNo: formData.accountNumber,
        bankAccountName: formData.accountName,
        installmentCount: formData.installmentCount,
      };

      const endpoint =
        isResubmit && existingLoan?.id
          ? `/api/student/loan-requests/${existingLoan.id}/resubmit`
          : "/api/student/loan-requests";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const mapped = mapStudentApiError(res.status, json, { isResubmit });
        setSubmitError(mapped.message);
        setSubmitErrorDetails(mapped);
        if (mapped.field && mapped.field in requiredFormFields) {
          const fieldKey = mapped.field as RequiredFormField;
          setFormErrors((prev) => ({ ...prev, [fieldKey]: mapped.message }));
        }
        return;
      }

      const loan = json.data as RawStudentLoan;
      setCreatedLoanData(loan);

      setIsApprovalModalOpen(false);
      setCurrentStep(3);
    } catch (err) {
      console.error("Submission failed", err);
      const netErr = mapNetworkError(err);
      setSubmitError(netErr.message);
      setSubmitErrorDetails(netErr);
    } finally {
      setIsSubmitting(false);
    }
  };

  const advisorSelectOptions =
    advisors.length > 0
      ? advisors.map((name) => ({ label: name, value: name }))
      : tempLoanFormOptions.advisors;

  if (existingLoan && existingLoan.status !== "returned") {
    return (
      <main className={styles.studentPage}>
        <StudentTopNav
          showSidebarButton={false}
          userEmail={profile.contactEmail || `${profile.studentId}@cmu.ac.th`}
          userId={profile.studentId}
          userName={profile.displayName}
          userNameEn={profile.displayNameEn}
          userRole="นักศึกษา"
        />
        <div className={styles.studentPageContent}>
          <div className={styles.loanApplicationPage}>
            <section
              className={styles.loanFormCard}
              style={{ textAlign: "center", padding: "3rem 1.5rem" }}
            >
              <span className={styles.existingLoanIconCircle}>
                <FileClock
                  aria-hidden="true"
                  className={styles.existingLoanIcon}
                  size={70}
                  strokeWidth={1.8}
                />
              </span>
              <h2 className={styles.existingLoanTitle}>
                {t(
                  "คุณมีคำร้องขอกู้ยืมที่กำลังดำเนินการอยู่แล้ว",
                  "You already have a loan request in progress",
                )}
              </h2>
              <p style={{ color: "#4b5563", marginBottom: "2rem" }}>
                {t(
                  "ระบบอนุญาตให้มีคำร้องขอกู้ยืมที่เปิดอยู่ได้ครั้งละ 1 คำร้องเท่านั้น ท่านสามารถตรวจสอบสถานะคำร้องปัจจุบันได้ที่หน้าหลัก",
                  "The system allows only one open loan request at a time. You can check the status of your current request on the home page.",
                )}
              </p>
              <button
                className={styles.loanApplicationDashboardButton}
                onClick={() => router.push("/student")}
                type="button"
              >
                <House aria-hidden="true" size={19} strokeWidth={2.2} />
                {t("กลับหน้าหลักเพื่อดูสถานะคำร้อง", "Back to home to check the request status")}
              </button>
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.studentPage}>
      <StudentTopNav
        showSidebarButton={false}
        userEmail={profile.contactEmail || `${profile.studentId}@cmu.ac.th`}
        userId={profile.studentId}
        userName={profile.displayName}
        userNameEn={profile.displayNameEn}
        userRole="นักศึกษา"
      />
      <div className={styles.studentPageContent}>
        <div className={styles.loanApplicationPage}>
          <h1 className={styles.loanApplicationTitle}>
            {isResubmit
              ? t("แก้ไขและยื่นคำร้องกู้ยืม", "Edit Loan Application")
              : t("ยื่นคำร้องกู้ยืม", "Loan Application")}
          </h1>

          <ol
            className={styles.applicationStepper}
            aria-label={t("ขั้นตอนการยื่นคำร้องกู้ยืม", "Loan request submission steps")}
          >
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
                <h2 id="agreement-title">{t("ขั้นตอนที่ 1: ยืนยันข้อตกลงการกู้ยืม", "Step 1: Confirm the Loan Agreement")}</h2>
              </header>

              <div className={styles.loanAgreementScroll}>
                <h3 className={styles.loanAgreementHeading}>
                  <span>{loanAgreement.title}</span>
                  <span>{loanAgreement.organization}</span>
                </h3>
                <p>{loanAgreement.introduction}</p>
                {loanAgreement.sections.map((section) => (
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
                <span>{loanAgreement.acceptanceLabel}</span>
              </label>
            </section>
          ) : currentStep === 2 ? (
            <section className={styles.loanFormCard} aria-labelledby="loan-form-title">
              <h2 id="loan-form-title">
                {t("ขั้นตอนที่ 2: กรอกข้อมูลการกู้ยืม", "Step 2: Fill in Loan Information")}
              </h2>

              {isResubmit && existingLoan ? (
                <section
                  style={{
                    backgroundColor: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: "0.75rem",
                    padding: "1rem 1.25rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <RotateCcw
                      style={{ color: "#d97706", flexShrink: 0, marginTop: "2px" }}
                      size={20}
                    />
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          margin: "0 0 0.25rem 0",
                          color: "#92400e",
                          fontSize: "1rem",
                          fontWeight: 700,
                        }}
                      >
                        {t("คำร้องขอกู้ยืมถูกส่งกลับเพื่อแก้ไข", "The loan request was returned for correction")}
                      </h3>
                      {existingLoan.returnComment ? (
                        <div
                          style={{
                            margin: "0.5rem 0",
                            padding: "0.75rem",
                            backgroundColor: "#fef3c7",
                            borderRadius: "0.375rem",
                            borderLeft: "4px solid #d97706",
                            color: "#78350f",
                            fontSize: "0.875rem",
                          }}
                        >
                          <strong>
                            {t("ข้อความจาก", "Message from ")}
                            {existingLoan.returnStep === "admin"
                              ? t("เจ้าหน้าที่", "the staff")
                              : t("อาจารย์ที่ปรึกษา", "the advisor")}
                            :
                          </strong>{" "}
                          {existingLoan.returnComment}
                        </div>
                      ) : null}
                      <p style={{ margin: 0, color: "#b45309", fontSize: "0.875rem" }}>
                        {t(
                          "กรุณาแก้ไขข้อมูลให้ถูกต้องตามคำแนะนำ แล้วกดยืนยันเพื่อยื่นคำร้องใหม่อีกครั้ง",
                          "Please correct the information as advised, then confirm to submit the request again.",
                        )}
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}

              <div className={styles.loanFormSections}>
                <section className={styles.loanFormSection}>
                  <CardHeader
                    className={styles.loanFormSectionHeading}
                    icon={<UserRound aria-hidden="true" size={20} />}
                    title={t("ข้อมูลนักศึกษา", "Student Information")}
                  />
                  <div className={styles.loanFormStudentDetails}>
                    <p>
                      <span>{t("ชื่อ-นามสกุล", "Full name")}</span>
                      <strong>{studentName}</strong>
                    </p>
                    <p>
                      <span>{t("รหัสนักศึกษา", "Student ID")}</span>
                      <strong>{profile.studentId}</strong>
                    </p>
                    <p>
                      <span>{t("หลักสูตร", "Program")}</span>
                      <strong className={styles.loanFormProgramValue}>
                        {programLabel || t("พยาบาลศาสตรบัณฑิต", "Bachelor of Nursing Science")}
                      </strong>
                    </p>
                    <p>
                      <span>{t("วุฒิการศึกษา", "Education level")}</span>
                      <strong>{educationLevelLabel}</strong>
                    </p>
                  </div>
                  <div className={styles.loanFormFields}>
                    <label
                      className={[
                        styles.loanFormField,
                        formErrors.academicYear ? styles.loanFormFieldInvalid : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      ref={(element) => {
                        fieldRefs.current.academicYear = element ?? undefined;
                      }}
                    >
                      <span>{t("ชั้นปีการศึกษา", "Academic year")}</span>
                      {isGraduateDiploma ? (
                        <output className={styles.loanFormFixedValue}>1</output>
                      ) : (
                        <LoanFormSelect
                          error={formErrors.academicYear}
                          onBlur={() => handleFieldBlur("academicYear")}
                          onChange={(value) => updateFormField("academicYear", value)}
                          options={tempLoanFormOptions.academicYears}
                          placeholder={t("เลือกชั้นปีการศึกษา", "Select academic year")}
                          value={formData.academicYear}
                        />
                      )}
                      {formErrors.academicYear ? (
                        <small className={styles.loanFormFieldError}>
                          {formErrors.academicYear}
                        </small>
                      ) : null}
                    </label>

                    <label
                      className={[
                        styles.loanFormField,
                        formErrors.advisorName ? styles.loanFormFieldInvalid : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      ref={(element) => {
                        fieldRefs.current.advisorName = element ?? undefined;
                      }}
                    >
                      <span>{t("อาจารย์ที่ปรึกษา", "Advisor")}</span>
                      <LoanFormSelect
                        error={formErrors.advisorName}
                        onBlur={() => handleFieldBlur("advisorName")}
                        onChange={(value) => updateFormField("advisorName", value)}
                        options={advisorSelectOptions}
                        placeholder={t("เลือกอาจารย์ที่ปรึกษา", "Select advisor")}
                        value={formData.advisorName}
                      />
                      {formErrors.advisorName ? (
                        <small className={styles.loanFormFieldError}>
                          {formErrors.advisorName}
                        </small>
                      ) : null}
                    </label>

                    <label
                      className={[
                        styles.loanFormField,
                        formErrors.phoneNumber ? styles.loanFormFieldInvalid : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      ref={(element) => {
                        fieldRefs.current.phoneNumber = element ?? undefined;
                      }}
                    >
                      <span>{t("เบอร์โทรศัพท์", "Phone number")}</span>
                      <input
                        aria-invalid={Boolean(formErrors.phoneNumber)}
                        inputMode="numeric"
                        maxLength={10}
                        onBlur={() => handleFieldBlur("phoneNumber")}
                        onChange={(event) =>
                          updateFormField(
                            "phoneNumber",
                            event.target.value.replace(/\D/g, "").slice(0, 10),
                          )
                        }
                        placeholder={t("กรอกเบอร์โทรศัพท์", "Enter phone number")}
                        type="text"
                        value={formData.phoneNumber}
                      />
                      {formErrors.phoneNumber ? (
                        <small className={styles.loanFormFieldError}>
                          {formErrors.phoneNumber}
                        </small>
                      ) : null}
                    </label>
                  </div>
                </section>

                <section className={styles.loanFormSection}>
                  <CardHeader
                    className={styles.loanFormSectionHeading}
                    icon={<Landmark aria-hidden="true" size={20} />}
                    title={t("ข้อมูลธนาคาร", "Bank Information")}
                  />
                  <div className={styles.loanFormFields}>
                    <label
                      className={[
                        styles.loanFormField,
                        formErrors.bankName ? styles.loanFormFieldInvalid : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      ref={(element) => {
                        fieldRefs.current.bankName = element ?? undefined;
                      }}
                    >
                      <span>{t("ธนาคาร", "Bank")}</span>
                      <LoanFormSelect
                        error={formErrors.bankName}
                        onBlur={() => handleFieldBlur("bankName")}
                        onChange={(value) => updateFormField("bankName", value)}
                        options={tempLoanFormOptions.banks}
                        placeholder={t("เลือกธนาคาร", "Select bank")}
                        value={formData.bankName}
                      />
                      {formErrors.bankName ? (
                        <small className={styles.loanFormFieldError}>{formErrors.bankName}</small>
                      ) : null}
                    </label>

                    <label
                      className={[
                        styles.loanFormField,
                        formErrors.accountNumber ? styles.loanFormFieldInvalid : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      ref={(element) => {
                        fieldRefs.current.accountNumber = element ?? undefined;
                      }}
                    >
                      <span>{t("เลขที่บัญชีธนาคาร", "Bank account number")}</span>
                      <input
                        aria-invalid={Boolean(formErrors.accountNumber)}
                        inputMode="numeric"
                        maxLength={10}
                        onBlur={() => handleFieldBlur("accountNumber")}
                        onChange={(event) =>
                          updateFormField(
                            "accountNumber",
                            event.target.value.replace(/\D/g, "").slice(0, 10),
                          )
                        }
                        placeholder={t("กรอกเลขที่บัญชี", "Enter account number")}
                        type="text"
                        value={formData.accountNumber}
                      />
                      {formErrors.accountNumber ? (
                        <small className={styles.loanFormFieldError}>
                          {formErrors.accountNumber}
                        </small>
                      ) : null}
                    </label>

                    <label
                      className={[
                        styles.loanFormField,
                        formErrors.accountName ? styles.loanFormFieldInvalid : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      ref={(element) => {
                        fieldRefs.current.accountName = element ?? undefined;
                      }}
                    >
                      <span>{t("ชื่อบัญชีธนาคาร", "Bank account name")}</span>
                      <input
                        aria-invalid={Boolean(formErrors.accountName)}
                        onBlur={() => handleFieldBlur("accountName")}
                        onChange={(event) => updateFormField("accountName", event.target.value)}
                        placeholder={t("กรอกชื่อบัญชี", "Enter account name")}
                        type="text"
                        value={formData.accountName}
                      />
                      {formErrors.accountName ? (
                        <small className={styles.loanFormFieldError}>
                          {formErrors.accountName}
                        </small>
                      ) : null}
                    </label>
                  </div>
                </section>

                <section className={styles.loanFormSection}>
                  <CardHeader
                    className={styles.loanFormSectionHeading}
                    icon={<ClipboardList aria-hidden="true" size={20} />}
                    title={t("วัตถุประสงค์การกู้ยืม", "Loan Purpose")}
                  />
                  <div className={styles.loanFormFields}>
                    <label
                      className={[
                        styles.loanFormField,
                        formErrors.purpose ? styles.loanFormFieldInvalid : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      ref={(element) => {
                        fieldRefs.current.purpose = element ?? undefined;
                      }}
                    >
                      <span>{t("วัตถุประสงค์การกู้ยืม", "Loan purpose")}</span>
                      <input
                        aria-invalid={Boolean(formErrors.purpose)}
                        maxLength={40}
                        onBlur={() => handleFieldBlur("purpose")}
                        onChange={(event) => updateFormField("purpose", event.target.value)}
                        placeholder={t("กรอกวัตถุประสงค์", "Enter purpose")}
                        type="text"
                        value={formData.purpose}
                      />
                      <div className={styles.loanFormFieldMeta}>
                        {formErrors.purpose ? (
                          <small className={styles.loanFormFieldError}>{formErrors.purpose}</small>
                        ) : null}
                        <small className={styles.loanFormCharacterCount}>
                          {formData.purpose.length}/40 {t("ตัวอักษร", "characters")}
                        </small>
                      </div>
                    </label>

                    <label className={styles.loanFormField}>
                      <span>{t("หมายเหตุเพิ่มเติม", "Additional note")}</span>
                      <textarea
                        maxLength={200}
                        onChange={(event) => updateFormField("additionalNote", event.target.value)}
                        placeholder={t("กรอกหมายเหตุเพิ่มเติม", "Enter additional note")}
                        value={formData.additionalNote === "-" ? "" : formData.additionalNote}
                      />
                      <small className={styles.loanFormCharacterCount}>
                        {(formData.additionalNote === "-" ? "" : formData.additionalNote).length}/200{" "}
                        {t("ตัวอักษร", "characters")}
                      </small>
                    </label>
                  </div>
                </section>

                <section className={styles.loanFormSection}>
                  <CardHeader
                    className={styles.loanFormSectionHeading}
                    icon={<BahtCoinIcon aria-hidden="true" size={20} />}
                    title={t("จำนวนเงินที่ขอกู้ยืม", "Requested Loan Amount")}
                  />
                  <div className={styles.loanFormFields}>
                    <label
                      className={[
                        styles.loanFormField,
                        formErrors.loanAmount ? styles.loanFormFieldInvalid : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      ref={(element) => {
                        fieldRefs.current.loanAmount = element ?? undefined;
                      }}
                    >
                      <span>{t("จำนวนเงินที่ขอกู้ยืม (บาท)", "Requested loan amount (baht)")}</span>
                      <input
                        aria-invalid={Boolean(formErrors.loanAmount)}
                        inputMode="numeric"
                        onBlur={() => handleFieldBlur("loanAmount")}
                        onChange={(event) => handleLoanAmountChange(event.target.value)}
                        pattern="[0-9]*"
                        type="text"
                        value={formData.loanAmount}
                      />
                      {formData.loanAmount ? (
                        <p className={styles.loanAmountText}>
                          {language === "en"
                            ? formatEnglishBahtText(formData.loanAmount)
                            : formatThaiBahtText(formData.loanAmount)}
                        </p>
                      ) : null}
                      {formErrors.loanAmount ? (
                        <small className={styles.loanFormFieldError}>{formErrors.loanAmount}</small>
                      ) : null}
                    </label>
                    <fieldset className={styles.loanInstallmentField}>
                      <legend>{t("จำนวนงวดการชำระ", "Number of installments")}</legend>
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
                            {count} {t("งวด", "Inst.")}
                          </button>
                        ))}
                      </div>
                      <LoanDetailSchedule items={repaymentSchedule} />
                    </fieldset>
                  </div>
                </section>
              </div>
            </section>
          ) : (
            <TempLoanDetailsStep
              createdLoan={createdLoanData}
              formData={savedFormData}
              profile={profile}
            />
          )}

          {currentStep === 1 ? (
            <div className={`${styles.loanFormActions} ${styles.loanStepActions}`}>
              <button
                className={styles.loanApplicationHomeButton}
                onClick={() => router.push("/student")}
                type="button"
              >
                <House aria-hidden="true" size={19} strokeWidth={2.2} />
                {t("กลับหน้าหลัก", "Back to home")}
              </button>
              <button
                className={styles.loanApplicationNext}
                disabled={!hasReadAgreement || !hasAcceptedAgreement}
                onClick={() => setCurrentStep(2)}
                type="button"
              >
                {t("ถัดไป", "Next")}
              </button>
            </div>
          ) : currentStep === 2 ? (
            <div className={`${styles.loanFormActions} ${styles.loanStepActions}`}>
              <button
                className={styles.loanFormBack}
                onClick={() => setCurrentStep(1)}
                type="button"
              >
                {t("ย้อนกลับ", "Back")}
              </button>
              <button
                className={styles.loanApplicationNext}
                onClick={handleLoanFormNext}
                type="button"
              >
                {t("ถัดไป", "Next")}
              </button>
            </div>
          ) : (
            <div className={styles.loanFormActions}>
              {!createdLoanData ? (
                <button
                  className={styles.loanFormBack}
                  onClick={() => setCurrentStep(2)}
                  type="button"
                >
                  {t("กลับไปแก้ไขข้อมูล", "Back to edit information")}
                </button>
              ) : null}
              <button
                className={styles.loanApplicationDashboardButton}
                onClick={() => router.push("/student")}
                type="button"
              >
                <House aria-hidden="true" size={19} strokeWidth={2.2} />
                {t("กลับหน้าหลัก", "Back to home")}
              </button>
            </div>
          )}
        </div>
      </div>

      {isApprovalModalOpen ? (
        <TempLoanApprovalModal
          errorDetails={submitErrorDetails}
          errorMessage={submitError}
          formData={savedFormData}
          isResubmit={isResubmit}
          isSubmitting={isSubmitting}
          onClose={() => {
            setSubmitError(null);
            setSubmitErrorDetails(null);
            setIsApprovalModalOpen(false);
          }}
          onConfirm={handleConfirmSubmission}
          profile={profile}
        />
      ) : null}
    </main>
  );
}
