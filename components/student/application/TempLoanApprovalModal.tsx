import type { TempLoanFormData } from "@/app/student/temp/tempMockData";
import {
  tempRepaymentSchedule,
  tempStudentProfile,
} from "@/app/student/temp/tempMockData";
import styles from "@/app/student/student.module.css";

type TempLoanApprovalModalProps = {
  formData: TempLoanFormData;
  onClose: () => void;
  onConfirm: () => void;
};

export default function TempLoanApprovalModal({
  formData,
  onClose,
  onConfirm,
}: TempLoanApprovalModalProps) {
  const schedule = tempRepaymentSchedule.slice(0, formData.installmentCount);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      aria-label="ยืนยันข้อมูลการกู้ยืม"
      className={styles.loanApprovalModalBackdrop}
      onMouseDown={handleBackdropClick}
      role="presentation"
    >
      <section
        aria-labelledby="loan-approval-modal-title"
        className={styles.loanApprovalModal}
        role="dialog"
      >
        <button
          aria-label="ปิดหน้าต่างยืนยันข้อมูล"
          className={styles.loanApprovalModalClose}
          onClick={onClose}
          type="button"
        >
          ×
        </button>

        <h2 id="loan-approval-modal-title">ยืนยันข้อมูลการกู้ยืม</h2>
        <p className={styles.loanApprovalWarning}>
          กรุณาตรวจสอบข้อมูลทางการเงินให้ถูกต้อง
          <br />
          หากข้อมูลผิดพลาดอาจทำให้คำร้องกู้ยืมเกิดความล่าช้า
        </p>

        <section className={styles.loanApprovalInfoCard}>
          <h3>ข้อมูลนักศึกษา</h3>
          <dl>
            <div>
              <dt>ชื่อ-นามสกุล:</dt>
              <dd>{tempStudentProfile.displayName.replace("นางสาว", "").trim()} มีโชค</dd>
            </div>
            <div>
              <dt>รหัสนักศึกษา:</dt>
              <dd>{tempStudentProfile.studentId}</dd>
            </div>
            <div>
              <dt>หลักสูตร:</dt>
              <dd>{tempStudentProfile.programName}</dd>
            </div>
            <div>
              <dt>ชั้นปีการศึกษา:</dt>
              <dd>ชั้นปีที่ {formData.academicYear}</dd>
            </div>
            <div>
              <dt>อาจารย์ที่ปรึกษา:</dt>
              <dd>{formData.advisorName || "-"}</dd>
            </div>
            <div>
              <dt>เบอร์โทรศัพท์:</dt>
              <dd>{formData.phoneNumber || "-"}</dd>
            </div>
          </dl>
        </section>

        <section className={styles.loanApprovalInfoCard}>
          <h3>ข้อมูลธนาคาร</h3>
          <dl>
            <div>
              <dt>ธนาคาร:</dt>
              <dd>{formData.bankName || "-"}</dd>
            </div>
            <div>
              <dt>เลขที่บัญชี:</dt>
              <dd>{formData.accountNumber || "-"}</dd>
            </div>
            <div>
              <dt>ชื่อบัญชี:</dt>
              <dd>{formData.accountName || "-"}</dd>
            </div>
          </dl>
        </section>

        <section className={styles.loanApprovalInfoCard}>
          <h3>ข้อมูลการกู้ยืม</h3>
          <dl>
            <div>
              <dt>วัตถุประสงค์การกู้ยืม:</dt>
              <dd>{formData.purpose || "-"}</dd>
            </div>
            <div>
              <dt>หมายเหตุเพิ่มเติม:</dt>
              <dd>{formData.additionalNote || "-"}</dd>
            </div>
            <div>
              <dt>จำนวนเงินที่ขอกู้ยืม (บาท):</dt>
              <dd>฿{formData.loanAmount || "0"}</dd>
            </div>
            <div>
              <dt>จำนวนงวดการชำระ:</dt>
              <dd>{formData.installmentCount} งวด</dd>
            </div>
          </dl>

          <div className={styles.loanApprovalSchedule}>
            <h4>ตารางการชำระ</h4>
            {schedule.map((item) => (
              <div key={item.installmentNumber}>
                <strong>งวด {item.installmentNumber}</strong>
                <span>{item.dueDateLabel}</span>
                <strong>{item.amount}</strong>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.loanApprovalActions}>
          <button className={styles.loanApprovalCancel} onClick={onClose} type="button">
            ยกเลิก
          </button>
          <button className={styles.loanApprovalConfirm} onClick={onConfirm} type="button">
            ยืนยัน
          </button>
        </div>
      </section>
    </div>
  );
}
