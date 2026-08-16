"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  tempLoanAgreement,
  tempLoanFormDefaults,
  tempStudentProfile,
  type TempLoanFormData,
} from "@/app/student/temp/tempMockData";
import { formatThaiBahtText } from "@/app/student/studentFormatters";
import TempLoanApprovalModal from "./TempLoanApprovalModal";
import TempLoanDetailsStep from "./TempLoanDetailsStep";
import LoanDetailSchedule from "../loan-details/LoanDetailSchedule";
import styles from "@/app/student/student.module.css";

type FormField = keyof Omit<TempLoanFormData, "academicYear" | "installmentCount">;

export default function TempLoanApplicationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agreementRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(
    searchParams.get("step") === "3" ? 3 : 1,
  );
  const [hasReadAgreement, setHasReadAgreement] = useState(false);
  const [hasAcceptedAgreement, setHasAcceptedAgreement] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [formData, setFormData] = useState(tempLoanFormDefaults);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [currentStep]);

  const updateFormField = (field: FormField, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const isLoanFormComplete = [
    formData.academicYear,
    formData.advisorName,
    formData.phoneNumber,
    formData.bankName,
    formData.accountNumber,
    formData.accountName,
    formData.purpose,
    formData.loanAmount,
  ].every((value) => value.trim().length > 0);

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
      amount: `฿${(installmentAmount + (index === formData.installmentCount - 1 ? installmentRemainder : 0)).toLocaleString("th-TH")}`,
    };
  });

  const handleAgreementScroll = () => {
    const agreementElement = agreementRef.current;

    if (!agreementElement) {
      return;
    }

    const hasReachedEnd =
      agreementElement.scrollTop + agreementElement.clientHeight >=
      agreementElement.scrollHeight - 8;

    if (hasReachedEnd) {
      setHasReadAgreement(true);
    }
  };

  const stepClassName = (step: 1 | 2 | 3) => {
    if (step < currentStep) {
      return styles.applicationStepComplete;
    }

    return step === currentStep ? styles.applicationStepActive : "";
  };

  return (
    <main className={styles.studentPage}>
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
          <h2 id="agreement-title">ขั้นตอนที่ 1: ยืนยันข้อตกลงการกู้ยืม</h2>

          <div
            aria-label="ข้อกำหนดและเงื่อนไขการกู้ยืมเงินเพื่อการศึกษา"
            className={styles.loanAgreementScroll}
            onScroll={handleAgreementScroll}
            ref={agreementRef}
            role="region"
            tabIndex={0}
          >
            <h3>{tempLoanAgreement.title}</h3>
            <h4>{tempLoanAgreement.organization}</h4>
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
              <h3>ข้อมูลนักศึกษา</h3>
              <p>
                <span>ชื่อ-นามสกุล:</span>{" "}
                <strong>{tempStudentProfile.displayName.replace("นางสาว", "").trim()} มีโชค</strong>
              </p>
              <p>
                <span>รหัสนักศึกษา:</span> <strong>{tempStudentProfile.studentId}</strong>
              </p>
              <p>
                <span>หลักสูตร:</span> <strong>{tempStudentProfile.programName}</strong>
              </p>
            </section>

            <div className={styles.loanFormFields}>
              <label className={styles.loanFormField}>
                <span>ชั้นปีการศึกษา</span>
                <div className={styles.loanFormSelectWrap}>
                  <select
                    className={
                      formData.academicYear ? "" : styles.loanFormSelectPlaceholder
                    }
                    required
                    value={formData.academicYear}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        academicYear: event.target.value,
                      }))
                    }
                  >
                    <option value="">เลือกชั้นปีการศึกษา</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                  {/* <small>{formData.academicYear}</small> */}
                </div>
              </label>

              <label className={styles.loanFormField}>
                <span>อาจารย์ที่ปรึกษา</span>
                <div className={styles.loanFormSelectWrap}>
                  <select
                    className={
                      formData.advisorName ? "" : styles.loanFormSelectPlaceholder
                    }
                    required
                    value={formData.advisorName}
                    onChange={(event) => updateFormField("advisorName", event.target.value)}
                  >
                    <option value="">เลือกอาจารย์ที่ปรึกษา</option>
                    <option value="พิมพา มีโชค">พิมพา มีโชค</option>
                    <option value="วรัญญู มีโชค">วรัญญู มีโชค</option>
                  </select>
                  {/* <small>{formData.advisorName || "ยังไม่ได้เลือก"}</small> */}
                </div>
              </label>

              <label className={styles.loanFormField}>
                <span>เบอร์โทรศัพท์</span>
                <input
                  inputMode="tel"
                  onChange={(event) => updateFormField("phoneNumber", event.target.value)}
                  placeholder="กรอกเบอร์โทรศัพท์"
                  required
                  type="tel"
                  value={formData.phoneNumber}
                />
              </label>

              <label className={styles.loanFormField}>
                <span>ธนาคาร</span>
                <div className={styles.loanFormSelectWrap}>
                  <select
                    required
                    value={formData.bankName}
                    onChange={(event) => updateFormField("bankName", event.target.value)}
                  >
                    <option value="">เลือกธนาคาร</option>
                    <option value="ธนาคารกสิกรไทย">ธนาคารกสิกรไทย</option>
                    <option value="ธนาคารกรุงไทย">ธนาคารกรุงไทย</option>
                  </select>
                  <small>{formData.bankName || "ยังไม่ได้เลือก"}</small>
                </div>
              </label>

              <label className={styles.loanFormField}>
                <span>เลขที่บัญชีธนาคาร</span>
                <input
                  inputMode="numeric"
                  onChange={(event) => updateFormField("accountNumber", event.target.value)}
                  placeholder="กรอกเลขที่บัญชี"
                  required
                  type="text"
                  value={formData.accountNumber}
                />
              </label>

              <label className={styles.loanFormField}>
                <span>ชื่อบัญชีธนาคาร</span>
                <input
                  onChange={(event) => updateFormField("accountName", event.target.value)}
                  placeholder="กรอกชื่อบัญชี"
                  required
                  type="text"
                  value={formData.accountName}
                />
              </label>

              <label className={styles.loanFormField}>
                <span>วัตถุประสงค์การกู้ยืม</span>
                <input
                  onChange={(event) => updateFormField("purpose", event.target.value)}
                  placeholder="กรอกวัตถุประสงค์"
                  required
                  type="text"
                  value={formData.purpose}
                />
              </label>

              <label className={styles.loanFormField}>
                <span>หมายเหตุเพิ่มเติม</span>
                <textarea
                  onChange={(event) => updateFormField("additionalNote", event.target.value)}
                  placeholder="กรอกหมายเหตุเพิ่มเติม"
                  value={formData.additionalNote === "-" ? "" : formData.additionalNote}
                />
              </label>

              <label className={styles.loanFormField}>
                <span>จำนวนเงินที่ขอกู้ยืม (บาท)</span>
                <input
                  inputMode="numeric"
                  min="0"
                  onChange={(event) => updateFormField("loanAmount", event.target.value)}
                  required
                  type="number"
                  value={formData.loanAmount}
                />
                {formData.loanAmount ? <p>{formatThaiBahtText(formData.loanAmount)}</p> : null}
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
          <TempLoanDetailsStep formData={formData} />
        )}

        {currentStep === 1 ? (
          <div className={styles.loanFormActions}>
            <button
              className={styles.loanApplicationDashboardButton}
              onClick={() => router.push("/student/temp?submitted=true")}
              type="button"
            >
              กลับไปที่ dashboard
            </button>
            <button
              className={styles.loanApplicationNext}
              disabled={!hasReadAgreement || !hasAcceptedAgreement}
              onClick={() => setCurrentStep(2)}
              type="button"
            >
              ถัดไป <span aria-hidden="true">→</span>
            </button>
          </div>
        ) : currentStep === 2 ? (
          <div className={styles.loanFormActions}>
            <button
              className={styles.loanFormBack}
              onClick={() => setCurrentStep(1)}
              type="button"
            >
              ← ย้อนกลับ
            </button>
            <button
              className={styles.loanApplicationNext}
              disabled={!isLoanFormComplete}
              onClick={() => setIsApprovalModalOpen(true)}
              type="button"
            >
              ถัดไป <span aria-hidden="true">→</span>
            </button>
          </div>
        ) : (
          <div className={styles.loanFormActions}>
            <button
              className={styles.loanFormBack}
              onClick={() => setCurrentStep(2)}
              type="button"
            >
              ← กลับไปแก้ไขข้อมูล
            </button>
            <button
              className={styles.loanApplicationDashboardButton}
              onClick={() => router.push("/student/temp?submitted=true")}
              type="button"
            >
              ← กลับไปที่ dashboard
            </button>
          </div>
        )}
      </div>

      {isApprovalModalOpen ? (
        <TempLoanApprovalModal
          formData={formData}
          onClose={() => setIsApprovalModalOpen(false)}
          onConfirm={() => {
            setIsApprovalModalOpen(false);
            setCurrentStep(3);
          }}
        />
      ) : null}
    </main>
  );
}
