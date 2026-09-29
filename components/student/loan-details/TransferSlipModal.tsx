import { Check, Clock3, FileText, X } from "lucide-react";
import {
  localizeStudentContent,
  useStudentLanguage,
} from "@/app/student/StudentLanguageProvider";
import ImageWithSkeleton from "@/components/shared/ImageWithSkeleton";
import { useModalDismiss } from "@/hooks/useBodyScrollLock";

type TransferSlipModalProps = {
  imageSrc: string;
  onClose: () => void;
  transferDetail?: string;
  transferredAt?: string;
  paymentEvidence?: {
    installmentNumber: number;
    amount: string;
    paidAt: string;
    checkedAt: string;
    status: "verified" | "failed" | "pending";
    reviewNote?: string;
  };
};

export default function TransferSlipModal({
  imageSrc,
  onClose,
  transferDetail,
  transferredAt,
  paymentEvidence,
}: TransferSlipModalProps) {
  const { language, t } = useStudentLanguage();
  const backdropDismiss = useModalDismiss({ onClose });
  const title = t("หลักฐานการโอนเงิน", "Transfer Proof");
  const summary = transferDetail
    ? localizeStudentContent(transferDetail, language)
    : t("เจ้าหน้าที่โอนเงิน", "Admin transferred money");
  const paymentStatusLabel =
    paymentEvidence?.status === "verified"
      ? t("ผ่าน", "Verified")
      : paymentEvidence?.status === "failed"
        ? t("ไม่ผ่าน", "Failed")
        : t("รอตรวจสอบ", "Pending");
  const paymentStatusClass =
    paymentEvidence?.status === "verified"
      ? "bg-emerald-50 text-emerald-700"
      : paymentEvidence?.status === "failed"
        ? "bg-red-50 text-red-700"
        : "bg-amber-50 text-amber-700";

  return (
    <div
      aria-label={title}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
      {...backdropDismiss}
      role="presentation"
    >
      <section
        aria-labelledby="transfer-proof-title"
        aria-modal="true"
        className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        role="dialog"
      >
        <button
          aria-label={t("ปิดหลักฐานการโอนเงิน", "Close transfer proof")}
          className="absolute right-5 top-4 z-10 rounded-full bg-gray-50 p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={20} />
        </button>
        <header className="flex shrink-0 items-start gap-2.5 border-b border-gray-100 px-5 pb-2 pt-[15px] pr-14 sm:px-6 sm:pr-16">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <FileText aria-hidden="true" size={26} />
          </span>
          <div className="min-w-0 text-left">
            <h2
              className="text-[17px] font-bold leading-none text-gray-900"
              id="transfer-proof-title"
              style={{ marginBottom: "5px" }}
            >
              {title}
            </h2>
            {paymentEvidence ? (
              <div className="mt-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
                <span>
                  {t("ชำระงวดที่", "Installment")} {paymentEvidence.installmentNumber} · {paymentEvidence.amount}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-bold ${paymentStatusClass}`}>
                  {paymentEvidence.status === "verified" ? (
                    <Check aria-hidden="true" size={13} strokeWidth={3} />
                  ) : paymentEvidence.status === "failed" ? (
                    <X aria-hidden="true" size={13} strokeWidth={3} />
                  ) : (
                    <Clock3 aria-hidden="true" size={13} strokeWidth={3} />
                  )}
                  {paymentStatusLabel}
                </span>
              </div>
            ) : (
              <>
                <p className="mt-0.5 text-sm text-gray-600">{summary}</p>
                {transferredAt ? <p className="mt-0.5 text-sm text-gray-500">{transferredAt}</p> : null}
              </>
            )}
          </div>
        </header>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4 sm:p-6">
          <div className="inline-flex max-w-full overflow-hidden rounded-xl">
            <ImageWithSkeleton
              alt={t("รูปสลิปการโอนเงินจากเจ้าหน้าที่", "Transfer proof image")}
              className="block h-auto max-h-[calc(100vh-10rem)] w-auto max-w-full rounded-xl object-contain"
              containerClassName="w-auto max-w-full overflow-hidden rounded-xl"
              loadingAspectRatio={342 / 400}
              loadingContainerClassName="!w-[342px] sm:!w-96"
              loadingImageClassName="!h-full !w-full object-contain"
              src={imageSrc}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
