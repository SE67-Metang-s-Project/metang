import {
  tempLoanTimeline,
  tempRepaymentSchedule,
  tempStudentProfile,
  type TempLoanFormData,
} from "@/app/student/temp/tempMockData";
import styles from "@/app/student/student.module.css";

type TempLoanDetailsStepProps = {
  formData: TempLoanFormData;
};

const studentName =
  tempStudentProfile.displayName.replace("นางสาว", "").trim() + " มีโชค";

export default function TempLoanDetailsStep({ formData }: TempLoanDetailsStepProps) {
  const schedule = tempRepaymentSchedule.slice(0, formData.installmentCount);

  return (
    <section className={styles.tempLoanDetailsSection} aria-labelledby="loan-details-step-title">
      <h2 id="loan-details-step-title">ขั้นตอนที่ 3: รายละเอียดการกู้ยืม</h2>

      <section className={styles.tempDetailOverview}>
        <div className={styles.tempDetailOverviewTopline}>
          <div>
            <h3>คำร้อง SL-2568-0001</h3>
            <p>ยื่นเมื่อ 18 ธ.ค. 2569 10:00 น.</p>
          </div>
          <span className={styles.tempDetailStatus}>รอยืนยันการรับเงิน</span>
        </div>
        <div className={styles.tempDetailOverviewGrid}>
          <div>
            <span>วัตถุประสงค์การกู้ยืม</span>
            <strong>ค่าเทอมภาคเรียนที่ 1/2569</strong>
          </div>
          <div className={styles.tempDetailAmount}>
            <span>จำนวนที่ขอกู้</span>
            <strong>฿{formData.loanAmount || "0"}</strong>
            <small>สามพันบาทไทยถ้วน</small>
          </div>
          <div>
            <span>หมายเหตุเพิ่มเติม</span>
            <strong>
              ข้าพเจ้ามีความจำเป็นต้องกู้ยืมเพื่อชำระค่าเทอม เนื่องจากครอบครัวขาดสภาพคล่องทางการเงิน
              เพื่อให้สามารถศึกษาต่อได้อย่างต่อเนื่อง
            </strong>
          </div>
        </div>
      </section>

      <section className={styles.tempDetailCard}>
        <h3>ไทม์ไลน์สถานะคำร้อง</h3>
        <ol className={styles.tempLoanTimeline}>
          {tempLoanTimeline.map((item) => (
            <li key={item.title}>
              <span aria-hidden="true">✓</span>
              <div>
                <strong>{item.title}</strong>
                <p>
                  {item.dateTime} · โดย {item.actor}
                </p>
                {item.transferDetails ? (
                  <ul>
                    {item.transferDetails.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
        <div className={styles.tempDetailTimelineActions}>
          <button className={styles.loanFormBack} type="button">
            ดูหลักฐานการโอนเงิน
          </button>
          <button className={styles.loanApplicationNext} type="button">
            ยืนยันการรับเงิน
          </button>
        </div>
      </section>

      <section className={styles.tempDetailCard}>
        <h3>ข้อมูลนักศึกษา</h3>
        <dl className={styles.tempDetailDefinitionList}>
          <div>
            <dt>ชื่อ-นามสกุล:</dt>
            <dd>{studentName}</dd>
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

      <section className={styles.tempDetailCard}>
        <h3>ข้อมูลธนาคาร</h3>
        <dl className={styles.tempDetailDefinitionList}>
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

      <section className={styles.tempDetailCard}>
        <h3>ข้อมูลการกู้ยืม</h3>
        <dl className={styles.tempDetailDefinitionList}>
          <div>
            <dt>วัตถุประสงค์การกู้ยืม:</dt>
            <dd>{formData.purpose || "จ่ายค่าเทอม"}</dd>
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
            <dt>จำนวนเงินตัวอักษร:</dt>
            <dd>สามพันบาทไทยถ้วน</dd>
          </div>
          <div>
            <dt>จำนวนงวดการชำระ:</dt>
            <dd>{formData.installmentCount} งวด</dd>
          </div>
        </dl>
        <div className={styles.tempDetailSchedule}>
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
    </section>
  );
}
