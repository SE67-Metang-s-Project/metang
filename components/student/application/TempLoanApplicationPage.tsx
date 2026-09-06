"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { House, RotateCcw, UserRound } from "lucide-react";
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

import type { StudentProfileDisplay } from "../dashboard/LoanSummaryCard";
import type { RawStudentLoan } from "@/lib/student-view-model";

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

  if (field === "loanAmount") {
    const amount = Number(value.replace(/,/g, ""));
    if (!value.trim() || isNaN(amount) || amount <= 0) {
      return "กรุณากรอกจำนวนเงินที่ถูกต้อง";
    }
  }

  if (!value.trim()) {
    return requiredFieldMessage;
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
  const [createdLoanData, setCreatedLoanData] = useState<RawStudentLoan | null>(null);

  const [profile] = useState<StudentProfileDisplay & { phoneNumber?: string }>(
    initialProfile ?? tempStudentProfile,
  );

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

  const savedEducationLevel = useStudentEducationLevel();
  const [formData, setFormData] = useState(() => {
    if (isResubmit && existingLoan) {
      return {
        ...tempLoanFormDefaults,
        phoneNumber: initialProfile?.phoneNumber || tempLoanFormDefaults.phoneNumber,
        educationLevel:
          savedEducationLevel ?? initialProfile?.educationLevel ?? tempLoanFormDefaults.educationLevel,
        academicYear: String(existingLoan.studentYear ?? tempLoanFormDefaults.academicYear),
        advisorName: existingLoan.advisorName || tempLoanFormDefaults.advisorName,
        bankName: existingLoan.bankName || tempLoanFormDefaults.bankName,
        accountNumber: existingLoan.bankAccountNo || tempLoanFormDefaults.accountNumber,
        accountName: existingLoan.bankAccountName || tempLoanFormDefaults.accountName,
        purpose: existingLoan.purpose || tempLoanFormDefaults.purpose,
        additionalNote: existingLoan.additionalNote || "",
        loanAmount: existingLoan.amount ? String(existingLoan.amount) : tempLoanFormDefaults.loanAmount,
        installmentCount: (existingLoan.installmentCount as 1 | 2 | 3 | 4) || 1,
      };
    }

    return {
      ...tempLoanFormDefaults,
      phoneNumber: initialProfile?.phoneNumber || tempLoanFormDefaults.phoneNumber,
      educationLevel:
        savedEducationLevel ?? initialProfile?.educationLevel ?? tempLoanFormDefaults.educationLevel,
    };
  });
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

  const handleConfirmSubmission = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (formData.phoneNumber && /^\d{10}$/.test(formData.phoneNumber)) {
        try {
          await fetch("/api/student/phone-number", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phoneNumber: formData.phoneNumber }),
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

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setSubmitError(
            isResubmit
              ? "คำร้องนี้ได้รับการเปลี่ยนแปลงแล้ว หรือไม่สามารถแก้ไขและยื่นใหม่ได้ในขณะนี้"
              : "คุณมีคำร้องขอกู้ยืมที่กำลังดำเนินการอยู่แล้ว",
          );
        } else if (res.status === 422 || res.status === 400) {
          setSubmitError(json.error?.message || "ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
        } else if (res.status === 401 || res.status === 403) {
          setSubmitError("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
        } else if (res.status === 404) {
          setSubmitError("ไม่พบคำร้องที่ต้องการแก้ไข");
        } else {
          setSubmitError(json.error?.message || "เกิดข้อผิดพลาดในการส่งคำร้อง กรุณาลองใหม่อีกครั้ง");
        }
        return;
      }

      const loan = json.data as RawStudentLoan;
      setCreatedLoanData(loan);

      if (!savedEducationLevel) {
        saveStudentEducationLevel(formData.educationLevel);
      }
      setIsApprovalModalOpen(false);
      setCurrentStep(3);
    } catch (err) {
      console.error("Submission failed", err);
      setSubmitError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
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
        <TopNav
          showSidebarButton={false}
          userEmail={profile.contactEmail || `${profile.studentId}@cmu.ac.th`}
          userId={profile.studentId}
          userName={profile.displayName}
          userRole="นักศึกษา"
        />
        <div className={styles.studentPageContent}>
          <div className={styles.loanApplicationPage}>
            <section
              className={styles.loanFormCard}
              style={{ textAlign: "center", padding: "3rem 1.5rem" }}
            >
              <h2 style={{ color: "#d97706", marginBottom: "1rem" }}>
                คุณมีคำร้องขอกู้ยืมที่กำลังดำเนินการอยู่แล้ว
              </h2>
              <p style={{ color: "#4b5563", marginBottom: "2rem" }}>
                ระบบอนุญาตให้มีคำร้องขอกู้ยืมที่เปิดอยู่ได้ครั้งละ 1 คำร้องเท่านั้น ท่านสามารถตรวจสอบสถานะคำร้องปัจจุบันได้ที่หน้าหลัก
              </p>
              <button
                className={styles.loanApplicationDashboardButton}
                onClick={() => router.push("/student")}
                type="button"
              >
                <House aria-hidden="true" size={19} strokeWidth={2.2} />
                กลับหน้าหลักเพื่อดูสถานะคำร้อง
              </button>
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.studentPage}>
      <TopNav
        showSidebarButton={false}
        userEmail={profile.contactEmail || `${profile.studentId}@cmu.ac.th`}
        userId={profile.studentId}
        userName={profile.displayName}
        userRole="นักศึกษา"
      />
      <div className={styles.studentPageContent}>
        <div className={styles.loanApplicationPage}>
        <h1 className={styles.loanApplicationTitle}>
          {isResubmit ? "แก้ไขและยื่นคำร้องกู้ยืม" : "ยื่นคำร้องกู้ยืม"}
        </h1>

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
                  <RotateCcw style={{ color: "#d97706", flexShrink: 0, marginTop: "2px" }} size={20} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 0.25rem 0", color: "#92400e", fontSize: "1rem", fontWeight: 700 }}>
                      คำร้องขอกู้ยืมถูกส่งกลับเพื่อแก้ไข
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
                          ข้อความจาก{existingLoan.returnStep === "admin" ? "เจ้าหน้าที่" : "อาจารย์ที่ปรึกษา"}:
                        </strong>{" "}
                        {existingLoan.returnComment}
                      </div>
                    ) : null}
                    <p style={{ margin: 0, color: "#b45309", fontSize: "0.875rem" }}>
                      กรุณาแก้ไขข้อมูลให้ถูกต้องตามคำแนะนำ แล้วกดยืนยันเพื่อยื่นคำร้องใหม่อีกครั้ง
                    </p>
                  </div>
                </div>
              </section>
            ) : null}

            <section className={styles.loanFormStudentCard}>
              <CardHeader
                className={styles.sectionCardHeading}
                icon={<UserRound aria-hidden="true" size={20} strokeWidth={2.2} />}
                title="ข้อมูลนักศึกษา"
              />
              <div className={styles.loanFormStudentDetails}>
                <p>
                  <span>ชื่อ-นามสกุล</span>
                  <strong>{profile.displayName.replace("นางสาว", "").trim()}</strong>
                </p>
                <p>
                  <span>รหัสนักศึกษา</span>
                  <strong>{profile.studentId}</strong>
                </p>
                <p>
                  <span>หลักสูตร</span>
                  <strong>{profile.programName || "พยาบาลศาสตรบัณฑิต"}</strong>
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
                  options={advisorSelectOptions}
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
          <TempLoanDetailsStep
            createdLoan={createdLoanData}
            formData={savedFormData}
            profile={profile}
          />
        )}

        {currentStep === 1 ? (
          <div className={styles.loanFormActions}>
            <button
              className={styles.loanApplicationHomeButton}
              onClick={() => router.push("/student")}
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
            {!createdLoanData ? (
              <button
                className={styles.loanFormBack}
                onClick={() => setCurrentStep(2)}
                type="button"
              >
                กลับไปแก้ไขข้อมูล
              </button>
            ) : null}
            <button
              className={styles.loanApplicationDashboardButton}
              onClick={() => router.push("/student")}
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
          errorMessage={submitError}
          formData={savedFormData}
          isResubmit={isResubmit}
          isSubmitting={isSubmitting}
          onClose={() => {
            setSubmitError(null);
            setIsApprovalModalOpen(false);
          }}
          onConfirm={handleConfirmSubmission}
          profile={profile}
        />
      ) : null}
    </main>
  );
}
