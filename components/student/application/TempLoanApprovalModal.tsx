import type { TempLoanFormData } from "@/app/student/temp/tempMockData";
import { tempStudentProfile } from "@/app/student/temp/tempMockData";
import { formatThaiBahtText } from "@/app/student/studentFormatters";
import { HandCoins, Landmark, UserRound, X } from "lucide-react";
import styles from "@/app/student/student.module.css";
import CardHeader from "@/components/shared/CardHeader";
import LoanDetailSchedule from "../loan-details/LoanDetailSchedule";

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
  const loanAmount = Number(formData.loanAmount) || 0;
  const installmentAmount = Math.floor(loanAmount / formData.installmentCount);
  const installmentRemainder = loanAmount % formData.installmentCount;
  const schedule = Array.from({ length: formData.installmentCount }, (_, index) => {
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
        installmentAmount +
        (index === formData.installmentCount - 1 ? installmentRemainder : 0)
      ).toLocaleString("th-TH")}`,
    };
  });

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
          className="absolute right-5 top-4 z-10 rounded-full bg-gray-50 p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={20} />
        </button>

        <h2 id="loan-approval-modal-title">ยืนยันข้อมูลการกู้ยืม</h2>
        <p className={styles.loanApprovalWarning}>
          กรุณาตรวจสอบข้อมูลทางการเงินให้ถูกต้อง
          <br />
          หากข้อมูลผิดพลาดอาจทำให้คำร้องกู้ยืมเกิดความล่าช้า
        </p>

        <section className={styles.loanApprovalInfoCard}>
          <CardHeader
            className={styles.sectionCardHeading}
            icon={<UserRound aria-hidden="true" size={20} strokeWidth={2.2} />}
            title="ข้อมูลนักศึกษา"
          />
          <dl>
            <div>
              <dt>ชื่อ-นามสกุล</dt>
              <dd>{tempStudentProfile.displayName.replace("นางสาว", "").trim()}</dd>
            </div>
            <div>
              <dt>รหัสนักศึกษา</dt>
              <dd>{tempStudentProfile.studentId}</dd>
            </div>
            <div>
              <dt>หลักสูตร</dt>
              <dd>{tempStudentProfile.programName}</dd>
            </div>
            <div>
              <dt>วุฒิการศึกษา</dt>
              <dd>{formData.educationLevel || "-"}</dd>
            </div>
            <div>
              <dt>ชั้นปีการศึกษา</dt>
              <dd>ชั้นปีที่ {formData.academicYear}</dd>
            </div>
            <div>
              <dt>เบอร์โทรศัพท์</dt>
              <dd>{formData.phoneNumber || "-"}</dd>
            </div>
            <div>
              <dt>อาจารย์ที่ปรึกษา</dt>
              <dd>{formData.advisorName || "-"}</dd>
            </div>
          </dl>
        </section>

        <section className={styles.loanApprovalInfoCard}>
          <CardHeader
            className={styles.sectionCardHeading}
            icon={<Landmark aria-hidden="true" size={20} strokeWidth={2.2} />}
            title="ข้อมูลธนาคาร"
          />
          <dl>
            <div>
              <dt>ธนาคาร</dt>
              <dd>{formData.bankName || "-"}</dd>
            </div>
            <div>
              <dt>เลขที่บัญชี</dt>
              <dd>{formData.accountNumber || "-"}</dd>
            </div>
            <div>
              <dt>ชื่อบัญชี</dt>
              <dd>{formData.accountName || "-"}</dd>
            </div>
          </dl>
        </section>

        <section className={styles.loanApprovalInfoCard}>
          <CardHeader
            className={styles.sectionCardHeading}
            icon={<HandCoins aria-hidden="true" size={20} strokeWidth={2.2} />}
            title="ข้อมูลการกู้ยืม"
          />
          <dl>
            <div>
              <dt>วัตถุประสงค์การกู้ยืม</dt>
              <dd>{formData.purpose || "-"}</dd>
            </div>
            <div>
              <dt>หมายเหตุเพิ่มเติม</dt>
              <dd>{formData.additionalNote || "-"}</dd>
            </div>
            <div className={styles.loanAmountRow}>
              <dt>จำนวนเงินที่ขอกู้ยืม (บาท)</dt>
              <dd>{formData.loanAmount || "0"}</dd>
            </div>
            <div>
              <dt>จำนวนเงินตัวอักษร</dt>
              <dd className={styles.loanAmountText}>
                {formatThaiBahtText(formData.loanAmount || "0")}
              </dd>
            </div>
            <div>
              <dt>จำนวนงวดการชำระ</dt>
              <dd>{formData.installmentCount} งวด</dd>
            </div>
          </dl>

        </section>

        <LoanDetailSchedule items={schedule} />

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
