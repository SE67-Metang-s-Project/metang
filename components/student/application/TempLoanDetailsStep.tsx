"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  tempLoanFormOptions,
  tempStudentProfile,
  tempCurrentLoanDetails,
  type TempLoanFormData,
} from "@/app/student/temp/tempMockData";
import { Landmark, UserRound, X } from "lucide-react";
import { localizeStudentContent, useStudentLanguage } from "@/app/student/StudentLanguageProvider";
import styles from "@/app/student/student.module.css";
import BahtCoinIcon from "@/components/shared/BahtCoinIcon";
import {
  formatEnglishBahtText,
  formatThaiBahtText,
  parseLoanAmount,
} from "@/app/student/studentFormatters";
import CardHeader from "@/components/shared/CardHeader";
import LoanDetailSchedule from "../loan-details/LoanDetailSchedule";
import LoanDetailOverview from "../loan-details/LoanDetailOverview";
import LoanTimeline from "../loan-details/LoanTimeline";

import type { LoanTimelineItem } from "@/app/student/studentMockData";
import type { StudentProfileDisplay } from "../dashboard/LoanSummaryCard";
import { mapToLoanDetails, type RawStudentLoan } from "@/lib/student-view-model";

type TempLoanDetailsStepProps = {
  formData: TempLoanFormData;
  profile?: StudentProfileDisplay;
  createdLoan?: RawStudentLoan | null;
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

export default function TempLoanDetailsStep({
  formData,
  profile,
  createdLoan,
}: TempLoanDetailsStepProps) {
  const router = useRouter();
  const { language, t } = useStudentLanguage();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const currentProfile: StudentProfileDisplay = profile ?? tempStudentProfile;
  const initialTimeline: LoanTimelineItem[] = [
    {
      title: t("ยื่นคำร้องกู้ยืมเงิน", "Loan request submitted"),
      dateTime: t("ยื่นแล้ว", "Submitted"),
      actor: t("นักศึกษา", "Student"),
      isCompleted: true,
    },
    {
      title: t("อาจารย์ที่ปรึกษาพิจารณาคำร้อง", "Advisor reviewing the request"),
      dateTime: t("กำลังดำเนินการ", "In progress"),
      actor: t("อาจารย์ที่ปรึกษา", "Advisor"),
      isPending: true,
    },
  ];
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

  const mappedLoanDetails = createdLoan ? mapToLoanDetails(createdLoan) : null;

  const loanAmount = parseLoanAmount(formData.loanAmount);
  const baseInstallmentAmount = Math.floor(loanAmount / formData.installmentCount);
  const installmentRemainder = loanAmount % formData.installmentCount;
  const fallbackSchedule = Array.from({ length: formData.installmentCount }, (_, index) => {
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
        baseInstallmentAmount +
        (index === formData.installmentCount - 1 ? installmentRemainder : 0)
      ).toLocaleString("th-TH")}`,
    };
  });

  const schedule = mappedLoanDetails?.schedule?.length ? mappedLoanDetails.schedule : fallbackSchedule;
  const fullTimeline = mappedLoanDetails?.timeline?.length ? mappedLoanDetails.timeline : initialTimeline;
  const hasAdminFinishedTransfer = createdLoan?.status === "disbursed" || Boolean(createdLoan?.disbursedAt);
  const timelineItems = fullTimeline.filter((item) => !item.isUpcoming);
  const canCancelRequest = Boolean(createdLoan?.id) && !hasAdminFinishedTransfer;

  const handleCancelRequest = async () => {
    if (!createdLoan?.id) return;

    setIsCancelling(true);
    try {
      const response = await fetch(`/api/student/loan-requests/${createdLoan.id}/cancel`, {
        method: "POST",
      });
      if (!response.ok) {
        window.alert(t("ไม่สามารถยกเลิกคำร้องได้ กรุณาลองใหม่อีกครั้ง", "Unable to cancel the request. Please try again."));
        return;
      }

      router.replace("/student");
    } catch {
      window.alert(t("ไม่สามารถยกเลิกคำร้องได้ กรุณาลองใหม่อีกครั้ง", "Unable to cancel the request. Please try again."));
    } finally {
      setIsCancelling(false);
    }
  };

  const details = {
    ...tempCurrentLoanDetails,
    requestNumber: mappedLoanDetails?.requestNumber ?? tempCurrentLoanDetails.requestNumber,
    statusLabel: mappedLoanDetails?.statusLabel ?? "รออาจารย์ที่ปรึกษาพิจารณา",
    submittedAt: mappedLoanDetails?.submittedAt ?? tempCurrentLoanDetails.submittedAt,
    amount: formData.loanAmount ? `${parseLoanAmount(formData.loanAmount).toLocaleString("th-TH")}` : "0",
    purpose: formData.purpose || tempCurrentLoanDetails.purpose,
    additionalReason: formData.additionalNote === "-" ? "-" : formData.additionalNote,
    schedule,
  };

  return (
    <section className={styles.tempLoanDetailsSection} aria-labelledby="loan-details-step-title">
      <h2 id="loan-details-step-title">
        {t("ขั้นตอนที่ 3: รายละเอียดการกู้ยืม", "Step 3: Loan Details")}
      </h2>

      <LoanDetailOverview details={details} />
      <LoanTimeline
        items={timelineItems}
        confirmTransferLabel={hasAdminFinishedTransfer ? t("ยืนยันการรับเงิน", "Confirm Receipt") : undefined}
        onCancelRequest={() => setIsCancelDialogOpen(true)}
        onShowTransferSlip={hasAdminFinishedTransfer ? () => undefined : undefined}
        showCancelRequest={canCancelRequest}
      />

      <section className={styles.tempDetailCard}>
        <CardHeader
          className={styles.sectionCardHeading}
          icon={<UserRound aria-hidden="true" size={20} strokeWidth={2.2} />}
          title={t("ข้อมูลนักศึกษา", "Student Information")}
        />
        <dl className={styles.tempDetailDefinitionList}>
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

      <section className={styles.tempDetailCard}>
        <CardHeader
          className={styles.sectionCardHeading}
          icon={<Landmark aria-hidden="true" size={20} strokeWidth={2.2} />}
          title={t("ข้อมูลธนาคาร", "Bank Information")}
        />
        <dl className={styles.tempDetailDefinitionList}>
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

      <section className={styles.tempDetailCard}>
        <CardHeader
          className={styles.sectionCardHeading}
          icon={<BahtCoinIcon aria-hidden="true" size={20} />}
          title={t("ข้อมูลการกู้ยืม", "Loan Information")}
        />
        <dl className={styles.tempDetailDefinitionList}>
          <div>
            <dt>{t("วัตถุประสงค์การกู้ยืม", "Loan purpose")}</dt>
            <dd>{formData.purpose || t("จ่ายค่าเทอม", "Pay tuition fee")}</dd>
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
            <dd>
              {language === "en"
                ? formatEnglishBahtText(formData.loanAmount || "0")
                : formatThaiBahtText(formData.loanAmount || "0")}
            </dd>
          </div>
          <div>
            <dt>{t("จำนวนงวดการชำระ", "Number of installments")}</dt>
            <dd>{formData.installmentCount} {t("งวด", "Inst.")}</dd>
          </div>
        </dl>
      </section>

      <LoanDetailSchedule items={schedule} />
      {isCancelDialogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
          onClick={() => setIsCancelDialogOpen(false)}
          role="presentation"
        >
          <section
            aria-labelledby="step-three-cancel-request-title"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="alertdialog"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <X aria-hidden="true" size={28} strokeWidth={2.5} />
            </div>
            <h2
              className="mt-4 text-center text-xl font-bold text-gray-900"
              id="step-three-cancel-request-title"
            >
              {t("ยืนยันการยกเลิกคำร้อง", "Confirm Request Cancellation")}
            </h2>
            <p className="mt-2 text-center text-sm leading-6 text-gray-600">
              {t(
                "เมื่อยกเลิกแล้ว คำร้องนี้จะไม่สามารถดำเนินการต่อได้",
                "Once cancelled, this request cannot be processed further.",
              )}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                disabled={isCancelling}
                onClick={() => setIsCancelDialogOpen(false)}
                type="button"
              >
                {t("กลับ", "Back")}
              </button>
              <button
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                disabled={isCancelling}
                onClick={handleCancelRequest}
                type="button"
              >
                {isCancelling ? t("กำลังยกเลิก...", "Cancelling...") : t("ยืนยันยกเลิก", "Confirm cancellation")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
