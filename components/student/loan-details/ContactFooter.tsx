"use client";

import { Clock3, Copy, Headphones, Mail, MapPin, Phone } from "lucide-react";
import { loanContact } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";
import { useStudentLanguage } from "@/app/student/StudentLanguageProvider";

export default function ContactFooter() {
  const { t } = useStudentLanguage();
  const copyPhoneNumber = () => {
    void navigator.clipboard?.writeText(loanContact.phone);
  };

  return (
    <footer
      aria-label={t("ช่องทางการติดต่อ", "Contact information")}
      className={styles.contactFooter}
    >
      <header className={styles.sectionCardHeading}>
        <h2>
          <Headphones aria-hidden="true" size={27} strokeWidth={2.2} />
          {t("ติดต่อเจ้าหน้าที่", "Contact staff")}
        </h2>
      </header>
      <div className={styles.contactFooterGrid}>
        <div className={styles.contactFooterItem}>
          <Phone aria-hidden="true" />
          <a href={`tel:${loanContact.phone}`}>{loanContact.phone}</a>
          <button
            aria-label={t("คัดลอกเบอร์โทรศัพท์", "Copy phone number")}
            className={styles.contactFooterCopyButton}
            onClick={copyPhoneNumber}
            title={t("คัดลอกเบอร์โทรศัพท์", "Copy phone number")}
            type="button"
          >
            <Copy aria-hidden="true" />
          </button>
        </div>
        <a className={styles.contactFooterItem} href={`mailto:${loanContact.email}`}>
          <Mail aria-hidden="true" />
          <span>{loanContact.email}</span>
          <Copy aria-hidden="true" className={styles.contactFooterCopyIcon} />
        </a>
        <div className={styles.contactFooterItem}>
          <MapPin aria-hidden="true" />
          <span>{loanContact.location}</span>
        </div>
        <div className={styles.contactFooterItem}>
          <Clock3 aria-hidden="true" />
          <span>{loanContact.openingHours}</span>
        </div>
      </div>
    </footer>
  );
}
