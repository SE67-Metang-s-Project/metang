"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, LogIn, RefreshCw, X } from "lucide-react";
import {
  activeLoan as defaultActiveLoan,
  loanRequestHistory as defaultLoanRequestHistory,
  studentProfile as defaultStudentProfile,
} from "@/app/student/studentMockData";
import LoanHistoryList from "./LoanHistoryList";
import LoanSummaryCard, { type ActiveLoanDisplay, type StudentProfileDisplay } from "./LoanSummaryCard";
import TempLoanSummaryCard from "./TempLoanSummaryCard";
import PaymentBehaviorCard from "./PaymentBehaviorCard";
import LoanTimeline from "../loan-details/LoanTimeline";
import LoanDetailSchedule from "../loan-details/LoanDetailSchedule";
import LoanPetitionModal from "@/components/shared/LoanPetitionModal";
import InstallmentList from "../payments/InstallmentList";
import PaymentModal, { type PaymentSubmission } from "@/components/shared/PaymentModal";
import type {
  InstallmentPayment,
  LoanDetails,
  LoanRequestHistoryItem,
  LoanScheduleItem,
  LoanTimelineItem,
  PaymentAccount,
} from "@/app/student/studentMockData";
import { MedicalBagIcon } from "./StudentIllustrations";
import ContactFooter from "../loan-details/ContactFooter";
import TransferSlipModal from "../loan-details/TransferSlipModal";
import StudentTopNav from "@/components/student/StudentTopNav";
import { useStudentLanguage } from "@/app/student/StudentLanguageProvider";
import { useModalDismiss } from "@/hooks/useBodyScrollLock";
import {
  computePaymentBehavior,
  mapToActiveLoanSummary,
  mapToInstallmentPayments,
  mapToLoanDetails,
  mapToLoanRequestHistoryItem,
  type PaymentBehaviorDisplay,
  type RawStudentLoan,
} from "@/lib/student-view-model";
import {
  mapNetworkError,
  mapStudentApiError,
  mapStudentPaymentError,
  type StudentUiError,
} from "@/lib/student-error-mapper";
import {
  hasConfirmedTransfer,
  saveTransferConfirmation,
  subscribeToTransferConfirmation,
} from "@/lib/student-transfer-confirmation";
import { mapStudentLoanToActionRequest } from "@/lib/student-action-request";
import { getBankLogoSrc } from "@/lib/bank-name";
import styles from "@/app/student/student.module.css";

type StudentDashboardProps = {
  profile?: StudentProfileDisplay;
  initialActiveLoan?: ActiveLoanDisplay | null;
  initialHistoryRequests?: LoanRequestHistoryItem[];
  initialInstallments?: InstallmentPayment[];
  initialLoanDetails?: LoanDetails | null;
  initialPaymentBehavior?: PaymentBehaviorDisplay | null;
  initialTimeline?: LoanTimelineItem[];
  initialSchedule?: LoanScheduleItem[];
};

type PaymentAccountSettings = {
  bankName: string;
  accountName: string;
  accountNumber: string;
};

function mapPaymentAccount(settings: PaymentAccountSettings): PaymentAccount {
  return {
    bankLabel: "ธนาคาร",
    bankName: settings.bankName,
    bankLogoSrc: getBankLogoSrc(settings.bankName),
    accountNameLabel: "ชื่อบัญชี",
    accountName: settings.accountName,
    accountNumberLabel: "เลขที่บัญชี",
    accountNumber: settings.accountNumber,
  };
}

export default function StudentDashboard({
  profile: initialProfile,
  initialActiveLoan,
  initialHistoryRequests,
  initialInstallments,
  initialLoanDetails = null,
  initialPaymentBehavior,
  initialTimeline,
  initialSchedule,
}: StudentDashboardProps) {
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [activePayment, setActivePayment] = useState<InstallmentPayment | null>(null);
  const [activePaymentAccount, setActivePaymentAccount] = useState<PaymentAccount | null>(null);
  const [isPaymentSuccessOpen, setIsPaymentSuccessOpen] = useState(false);
  const [isTransferSlipOpen, setIsTransferSlipOpen] = useState(false);
  const [isPetitionModalOpen, setIsPetitionModalOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const paymentSuccessDismiss = useModalDismiss({
    onClose: () => setIsPaymentSuccessOpen(false),
    isOpen: isPaymentSuccessOpen,
  });

  const cancelDialogDismiss = useModalDismiss({
    onClose: () => {
      if (!isCancelling) setIsCancelDialogOpen(false);
    },
    isOpen: isCancelDialogOpen,
  });
  const preservedScrollPosition = useRef<number | null>(null);
  const router = useRouter();

  const [profile] = useState<StudentProfileDisplay>(initialProfile ?? defaultStudentProfile);
  const [activeLoanData, setActiveLoanData] = useState<ActiveLoanDisplay | null | undefined>(initialActiveLoan);
  const [historyRequests, setHistoryRequests] = useState<LoanRequestHistoryItem[] | undefined>(initialHistoryRequests);
  const [installments, setInstallments] = useState<InstallmentPayment[] | undefined>(initialInstallments);
  const [loanDetails, setLoanDetails] = useState<LoanDetails | null>(initialLoanDetails);
  const [paymentBehaviorData, setPaymentBehaviorData] = useState<PaymentBehaviorDisplay | null | undefined>(
    initialPaymentBehavior,
  );
  const [timeline, setTimeline] = useState<LoanTimelineItem[] | undefined>(initialTimeline);
  const [schedule, setSchedule] = useState<LoanScheduleItem[] | undefined>(initialSchedule);
  const [dashboardError, setDashboardError] = useState<StudentUiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { setDefaultLanguage, t } = useStudentLanguage();
  const activeTimeline = timeline ?? [];
  const dashboardTimeline = activeTimeline.filter((item) => !item.isUpcoming);
  const defaultLanguage = profile.studentId.charAt(5) === "0" ? "th" : "en";

  useEffect(() => {
    setDefaultLanguage(defaultLanguage);
  }, [defaultLanguage, setDefaultLanguage]);

  useEffect(() => {
    if (initialActiveLoan !== undefined && initialHistoryRequests !== undefined && refreshKey === 0) {
      return;
    }

    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      setDashboardError(null);
      try {
        const [currentRes, listRes] = await Promise.all([
          fetch("/api/student/loan-requests/current"),
          fetch("/api/student/loan-requests"),
        ]);

        if (!currentRes.ok) {
          const errJson = await currentRes.json().catch(() => null);
          if (isMounted) {
            setDashboardError(mapStudentApiError(currentRes.status, errJson));
          }
          return;
        }

        if (!listRes.ok) {
          const errJson = await listRes.json().catch(() => null);
          if (isMounted) {
            setDashboardError(mapStudentApiError(listRes.status, errJson));
          }
          return;
        }

        const currentJson = await currentRes.json();
        const listJson = await listRes.json();

        if (isMounted) {
          const rawLoan = currentJson.data as RawStudentLoan | null;
          setActiveLoanData(mapToActiveLoanSummary(rawLoan));
          if (rawLoan) {
            const details = mapToLoanDetails(rawLoan);
            setLoanDetails(details);
            setTimeline(details.timeline);
            setSchedule(details.schedule);
            setInstallments(mapToInstallmentPayments(rawLoan.installments, rawLoan.payments));
          } else {
            setLoanDetails(null);
            setTimeline([]);
            setSchedule([]);
            setInstallments([]);
          }

          const rawList = (listJson.data || []) as RawStudentLoan[];
          setHistoryRequests(rawList.map(mapToLoanRequestHistoryItem));
          setPaymentBehaviorData(computePaymentBehavior(rawList));
        }
      } catch (err) {
        console.error("Failed to load student data from API", err);
        if (isMounted) {
          setDashboardError(mapNetworkError(err));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [initialActiveLoan, initialHistoryRequests, refreshKey]);

  useLayoutEffect(() => {
    if (preservedScrollPosition.current === null) {
      return;
    }

    window.scrollTo(window.scrollX, preservedScrollPosition.current);
    preservedScrollPosition.current = null;
  }, [showAllRequests]);

  const toggleRequestHistory = () => {
    preservedScrollPosition.current = window.scrollY;
    setShowAllRequests((current) => !current);
  };

  const openLoanDetails = (requestNumber: string) => {
    router.push(`/student/detail?request=${encodeURIComponent(requestNumber)}`);
  };

  const openPayment = async (installment: InstallmentPayment) => {
    try {
      const response = await fetch("/api/system-settings", { cache: "no-store" });
      const body = (await response.json().catch(() => null)) as {
        data?: PaymentAccountSettings;
      } | null;
      if (!response.ok || !body?.data) {
        throw new Error("Payment account unavailable");
      }

      setActivePaymentAccount(mapPaymentAccount(body.data));
      setActivePayment(installment);
    } catch {
      setDashboardError({
        status: 0,
        code: "INTERNAL_ERROR",
        title: t("ไม่พบข้อมูลบัญชีรับชำระเงิน", "Payment account unavailable"),
        message: t(
          "ระบบยังไม่สามารถแสดงบัญชีสำหรับชำระเงินได้ กรุณาลองใหม่ภายหลังหรือติดต่อเจ้าหน้าที่",
          "The payment account cannot be shown right now. Please try again later or contact the office.",
        ),
        action: "retry",
      });
    }
  };

  // Throws a user-facing Error so PaymentModal can show it and stay open for a retry.
  const submitPayment = async ({ slip, amount, paidAt }: PaymentSubmission) => {
    const formData = new FormData();
    formData.append("slip", slip);
    formData.append("amount", String(amount));
    formData.append("paidAt", paidAt);

    let response: Response;
    try {
      // No Content-Type header: the browser sets the multipart boundary itself.
      response = await fetch("/api/student/payments", { method: "POST", body: formData });
    } catch (err) {
      throw new Error(mapNetworkError(err).message);
    }

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      const uiError = mapStudentPaymentError(response.status, errJson);
      // A 409 means the loan moved on (already under review, settled, closed): show the latest.
      if (response.status === 409) setRefreshKey((key) => key + 1);
      throw new Error(uiError.message);
    }

    setActivePayment(null);
    setIsPaymentSuccessOpen(true);
    setRefreshKey((key) => key + 1);
  };

  const handleCancelRequest = async () => {
    if (!currentActiveLoan || !("id" in currentActiveLoan) || !currentActiveLoan.id) return;

    setIsCancelling(true);
    try {
      const response = await fetch(`/api/student/loan-requests/${currentActiveLoan.id}/cancel`, {
        method: "POST",
      });
      if (!response.ok) {
        window.alert(t("ไม่สามารถยกเลิกคำร้องได้ กรุณาลองใหม่อีกครั้ง", "Unable to cancel the request. Please try again."));
        return;
      }

      setIsCancelDialogOpen(false);
      setRefreshKey((key) => key + 1);
    } catch {
      window.alert(t("ไม่สามารถยกเลิกคำร้องได้ กรุณาลองใหม่อีกครั้ง", "Unable to cancel the request. Please try again."));
    } finally {
      setIsCancelling(false);
    }
  };

  const currentActiveLoan = activeLoanData === undefined ? defaultActiveLoan : activeLoanData;
  const currentInstallments = installments ?? [];
  const currentRequestStatus =
    loanDetails?.statusCode ??
    (currentActiveLoan && "status" in currentActiveLoan ? currentActiveLoan.status : undefined);
  const isTransferPending =
    currentRequestStatus === "pending_disbursement" ||
    [currentActiveLoan?.statusLabel, loanDetails?.statusLabel].some((label) =>
      ["รอยืนยันการโอนเงิน", "รอยืนยันการรับเงิน", "Transfer pending"].includes(label ?? ""),
    );
  const timelineRequestStatus = isTransferPending ? "pending_disbursement" : currentRequestStatus;
  const transferSlipImage =
    currentActiveLoan && "transferSlipImage" in currentActiveLoan
      ? currentActiveLoan.transferSlipImage
      : undefined;
  const hasAdminTransferredFunds =
    Boolean(
      currentActiveLoan &&
        "isDisbursed" in currentActiveLoan &&
        currentActiveLoan.isDisbursed,
    ) ||
    Boolean(currentActiveLoan && "status" in currentActiveLoan && currentActiveLoan.status === "closed") ||
    dashboardTimeline.some((item) => Boolean(item.transferDetails));
  const hasExecutiveApproved = Boolean(
    ["pending_disbursement", "disbursed", "closed"].includes(timelineRequestStatus ?? ""),
  );
  const isWaitingForTransferConfirmation = isTransferPending;
  const currentLoanKey =
    currentActiveLoan && "id" in currentActiveLoan && currentActiveLoan.id
      ? currentActiveLoan.id
      : currentActiveLoan?.requestNumber;
  const isTransferAccepted = useSyncExternalStore(
    (onChange) => subscribeToTransferConfirmation(currentLoanKey, onChange),
    () => hasConfirmedTransfer(currentLoanKey),
    () => false,
  );
  const displayedActiveLoan =
    isTransferAccepted && currentActiveLoan
      ? { ...currentActiveLoan, statusLabel: "กำลังชำระ" }
      : currentActiveLoan;
  const isActiveLoanReturned =
    Boolean(currentActiveLoan && "status" in currentActiveLoan && currentActiveLoan.status === "returned") ||
    Boolean(currentActiveLoan?.statusLabel.includes("แก้ไข"));
  const shouldShowDownload =
    Boolean(loanDetails) &&
    (isWaitingForTransferConfirmation ||
      hasAdminTransferredFunds ||
      ["disbursed", "closed"].includes(loanDetails?.statusCode ?? ""));
  const petitionRequest = useMemo(
    () => (loanDetails ? mapStudentLoanToActionRequest(loanDetails, profile) : null),
    [loanDetails, profile],
  );
  const displayedRequests = (historyRequests ?? defaultLoanRequestHistory).map((request) =>
    isTransferAccepted && request.requestNumber === currentActiveLoan?.requestNumber
      ? { ...request, statusLabel: "กำลังชำระ", statusType: "pending" as const }
      : request,
  );

  return (
    <main className={`${styles.studentPage} ${!currentActiveLoan ? styles.studentPageNoLoan : ""}`}>
      <StudentTopNav
        userName={profile.displayName}
        userNameEn={profile.displayNameEn}
        userId={profile.studentId}
        userRole="นักศึกษา"
        userEmail={profile.contactEmail || `${profile.studentId}@cmu.ac.th`}
        showSidebarButton={false}
      />

      <div className={styles.studentPageContent}>
        <div className={styles.studentContent}>
          {dashboardError ? (
            <div
              className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm"
              role="alert"
            >
              <div className="flex items-start gap-3">
                <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0 text-red-600" size={20} />
                <div>
                  <h3 className="font-semibold text-red-900">{dashboardError.title}</h3>
                  <p className="mt-0.5 text-sm text-red-700">{dashboardError.message}</p>
                </div>
              </div>
              <div className="shrink-0">
                {dashboardError.action === "login" ? (
                  <a
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700"
                    href="/login"
                  >
                    <LogIn size={14} />
                    เข้าสู่ระบบใหม่
                  </a>
                ) : (
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm hover:bg-red-50"
                    disabled={isLoading}
                    onClick={() => {
                      setRefreshKey((k) => k + 1);
                    }}
                    type="button"
                  >
                    <RefreshCw className={isLoading ? "animate-spin" : ""} size={14} />
                    ลองใหม่อีกครั้ง
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {currentActiveLoan ? (
            <LoanSummaryCard
              activeLoan={displayedActiveLoan ?? undefined}
              medicalBag={<MedicalBagIcon />}
              onOpenDetails={() => openLoanDetails(currentActiveLoan.requestNumber)}
              profile={profile}
            />
          ) : (
            <TempLoanSummaryCard profile={profile} />
          )}

          <PaymentBehaviorCard behavior={paymentBehaviorData} />

          <LoanTimeline
            advisorName={loanDetails?.advisorName}
            advisorNameEn={loanDetails?.advisorNameEn}
            compactActions
            hideBankDetails
            items={dashboardTimeline}
            isTransferAccepted={isTransferAccepted}
            onCancelRequest={() => setIsCancelDialogOpen(true)}
            onEditRequest={isActiveLoanReturned ? () => router.push("/student/loan/apply") : undefined}
            onConfirmTransfer={
              isWaitingForTransferConfirmation && hasAdminTransferredFunds
                ? () => saveTransferConfirmation(currentLoanKey)
                : undefined
            }
            onShowTransferSlip={
              hasAdminTransferredFunds
                ? () => {
                    if (transferSlipImage) {
                      setIsTransferSlipOpen(true);
                    } else {
                      router.push("/student/loan");
                    }
                  }
                : undefined
            }
            onDownloadRequest={
              shouldShowDownload && !isWaitingForTransferConfirmation
                ? () => setIsPetitionModalOpen(true)
                : undefined
            }
            showCancelRequest={Boolean(currentActiveLoan) && !hasExecutiveApproved}
            showEditRequest={isActiveLoanReturned}
            requestStatus={timelineRequestStatus}
          />

          <LoanDetailSchedule items={schedule ?? []} />

          {currentActiveLoan && "isDisbursed" in currentActiveLoan && currentActiveLoan.isDisbursed && currentInstallments.length > 0 ? (
            <InstallmentList
              installments={currentInstallments}
              isPaymentLocked={hasAdminTransferredFunds && !isTransferAccepted}
              onPay={openPayment}
            />
          ) : null}

          <LoanHistoryList
            onOpenRequest={openLoanDetails}
            onShowMore={toggleRequestHistory}
            requests={displayedRequests}
            showAllRequests={showAllRequests}
          />
          <ContactFooter />
        </div>
      </div>

      {activePayment && activePaymentAccount ? (
        <PaymentModal
          account={activePaymentAccount}
          installment={activePayment}
          onClose={() => {
            setActivePayment(null);
            setActivePaymentAccount(null);
          }}
          onConfirm={submitPayment}
        />
      ) : null}
      {isTransferSlipOpen && transferSlipImage ? (
        <TransferSlipModal
          imageSrc={transferSlipImage}
          onClose={() => setIsTransferSlipOpen(false)}
        />
      ) : null}
      {isPetitionModalOpen && petitionRequest ? (
        <LoanPetitionModal
          isOpen={isPetitionModalOpen}
          onClose={() => setIsPetitionModalOpen(false)}
          request={petitionRequest}
        />
      ) : null}

      {isPaymentSuccessOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
          {...paymentSuccessDismiss}
          role="presentation"
        >
          <section
            aria-labelledby="payment-success-title"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
            role="alertdialog"
          >
            <CheckCircle2 aria-hidden="true" className="mx-auto text-green-500" size={64} strokeWidth={1.5} />
            <h2 className="mt-4 text-2xl font-bold text-gray-900" id="payment-success-title">
              {t("ดำเนินการสำเร็จ!", "Payment submitted!")}
            </h2>
            <p className="mt-2 text-gray-600">
              {t("ส่งหลักฐานการชำระเงินเรียบร้อยแล้ว", "Your payment evidence has been submitted.")}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {t("เจ้าหน้าที่จะตรวจสอบและแจ้งผลให้ทราบภายหลัง", "Admin will review it and notify you later.")}
            </p>
            <button
              className="mt-6 w-full rounded-lg bg-green-600 px-4 py-3 font-bold text-white transition-colors hover:bg-green-700"
              onClick={() => setIsPaymentSuccessOpen(false)}
              type="button"
            >
              {t("ตกลง", "Done")}
            </button>
          </section>
        </div>
      ) : null}
      {isCancelDialogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
          {...cancelDialogDismiss}
          role="presentation"
        >
          <section
            aria-labelledby="dashboard-cancel-request-title"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="alertdialog"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <X aria-hidden="true" size={28} strokeWidth={2.5} />
            </div>
            <h2 className="mt-4 text-center text-xl font-bold text-gray-900" id="dashboard-cancel-request-title">
              {t("ยืนยันการยกเลิกคำร้อง", "Confirm cancellation")}
            </h2>
            <p className="mt-2 text-center text-sm leading-6 text-gray-600">
              {t(
                "เมื่อยกเลิกแล้ว คำร้องนี้จะไม่สามารถดำเนินการต่อได้",
                "This request cannot be restored.",
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
                {isCancelling ? t("กำลังยกเลิก...", "Cancelling...") : t("ยืนยันยกเลิก", "Cancel")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
