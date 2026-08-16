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
        aria-labelledby="transfer-slip-modal-title"
        aria-modal="true"
        className={styles.transferSlipModal}
        role="dialog"
      >
        <button
          aria-label="ปิดหลักฐานการโอนเงิน"
          className={styles.transferSlipModalClose}
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        <h2 id="transfer-slip-modal-title">หลักฐานการโอนเงิน</h2>
        <div className={styles.transferSlipImageFrame}>
          <img alt="รูปสลิปการโอนเงินจากเจ้าหน้าที่" src={imageSrc} />
        </div>
      </section>
    </div>
  );
}
