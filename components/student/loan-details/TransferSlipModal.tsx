import { FileText, X } from "lucide-react";
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
};

export default function TransferSlipModal({
  imageSrc,
  onClose,
  transferDetail,
  transferredAt,
}: TransferSlipModalProps) {
  const { language, t } = useStudentLanguage();
  const backdropDismiss = useModalDismiss({ onClose });
  const title = t("หลักฐานการโอนเงิน", "Transfer Proof");
  const summary = transferDetail
    ? localizeStudentContent(transferDetail, language)
    : t("เจ้าหน้าที่โอนเงิน", "Admin transferred money");

  return (
    <div
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
      {...backdropDismiss}
      role="presentation"
    >
      <section
        aria-labelledby="transfer-proof-title"
        aria-modal="true"
        className="relative flex max-h-[calc(100vh-2rem)] w-fit max-w-full flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
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
        <header className="flex shrink-0 items-start gap-3 border-b border-gray-100 px-5 py-4 pr-14 sm:px-6 sm:pr-16">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
            <FileText aria-hidden="true" size={22} />
          </span>
          <div className="min-w-0 text-left">
            <h2 className="text-lg font-bold leading-tight text-gray-900" id="transfer-proof-title">
              {title}
            </h2>
            <p className="mt-1 text-sm text-gray-600">{summary}</p>
            {transferredAt ? <p className="mt-0.5 text-sm text-gray-500">{transferredAt}</p> : null}
          </div>
        </header>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4 sm:p-6">
          <ImageWithSkeleton
            alt={t("รูปสลิปการโอนเงินจากเจ้าหน้าที่", "Transfer proof image")}
            className="h-auto max-h-[calc(100vh-10rem)] w-auto max-w-[calc(100vw-4rem)] rounded-xl object-contain"
            containerClassName="flex w-fit max-w-full items-center justify-center"
            loadingAspectRatio={342 / 400}
            loadingContainerClassName="!w-[342px] sm:!w-96"
            loadingImageClassName="!h-full !w-full object-contain"
            src={imageSrc}
          />
        </div>
      </section>
    </div>
  );
}
