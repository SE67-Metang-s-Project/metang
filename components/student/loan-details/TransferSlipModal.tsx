import { X } from "lucide-react";
import styles from "@/app/student/student.module.css";
import { useStudentLanguage } from "@/app/student/StudentLanguageProvider";
import { useModalDismiss } from "@/hooks/useBodyScrollLock";

type TransferSlipModalProps = {
  imageSrc: string;
  onClose: () => void;
};

export default function TransferSlipModal({ imageSrc, onClose }: TransferSlipModalProps) {
  const { t } = useStudentLanguage();
  const backdropDismiss = useModalDismiss({ onClose });
  const title = t("หลักฐานการโอนเงิน", "Transfer Proof");

  return (
    <div
      aria-label={title}
      className={styles.transferSlipModalBackdrop}
      {...backdropDismiss}
      role="presentation"
    >
      <section
        aria-labelledby="transfer-proof-title"
        aria-modal="true"
        className={`${styles.transferSlipModal} ${styles.transferProofModal}`}
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
        <h2 id="transfer-proof-title">{title}</h2>
        <div className={styles.transferSlipImageFrame}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={t("รูปสลิปการโอนเงินจากเจ้าหน้าที่", "Transfer proof image")} src={imageSrc} />
        </div>
      </section>
    </div>
  );
}
