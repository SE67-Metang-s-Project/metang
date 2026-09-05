import { X } from "lucide-react";
import styles from "@/app/student/student.module.css";

type TransferSlipModalProps = {
  imageSrc: string;
  onClose: () => void;
};

export default function TransferSlipModal({ imageSrc, onClose }: TransferSlipModalProps) {
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      aria-label="หลักฐานการโอนเงิน"
      className={styles.transferSlipModalBackdrop}
      onMouseDown={handleBackdropClick}
      role="presentation"
    >
      <section
        aria-label="หลักฐานการโอนเงิน"
        aria-modal="true"
        className={`${styles.transferSlipModal} ${styles.transferProofModal}`}
        role="dialog"
      >
        <button
          aria-label="ปิดหลักฐานการโอนเงิน"
          className="absolute right-5 top-4 z-10 rounded-full bg-gray-50 p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={20} />
        </button>
        <div className={styles.transferSlipImageFrame}>
          <img alt="รูปสลิปการโอนเงินจากเจ้าหน้าที่" src={imageSrc} />
        </div>
      </section>
    </div>
  );
}
