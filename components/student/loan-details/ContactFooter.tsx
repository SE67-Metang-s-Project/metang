"use client";

import { useState } from "react";
import { Check, Clock3, Copy, Headphones, Mail, MapPin, Phone } from "lucide-react";
import { loanContact } from "@/app/student/studentMockData";
import styles from "@/app/student/student.module.css";
import { useStudentLanguage } from "@/app/student/StudentLanguageProvider";

export default function ContactFooter() {
  const { t } = useStudentLanguage();
  const [isPhoneCopied, setIsPhoneCopied] = useState(false);
  const [isEmailCopied, setIsEmailCopied] = useState(false);

  const copyContactValue = async (
    value: string,
    setCopied: (copied: boolean) => void,
  ) => {
    if (!navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
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
        <div className={`${styles.contactFooterItem} ${styles.contactFooterPrimaryItem}`}>
          <Phone aria-hidden="true" />
          <a href={`tel:${loanContact.phone}`}>{loanContact.phone}</a>
          <button
            aria-label={
              isPhoneCopied
                ? t("คัดลอกเบอร์โทรศัพท์แล้ว", "Phone number copied")
                : t("คัดลอกเบอร์โทรศัพท์", "Copy phone number")
            }
            className={styles.contactFooterCopyButton}
            onClick={() => copyContactValue(loanContact.phone, setIsPhoneCopied)}
            title={
              isPhoneCopied
                ? t("คัดลอกเบอร์โทรศัพท์แล้ว", "Phone number copied")
                : t("คัดลอกเบอร์โทรศัพท์", "Copy phone number")
            }
            type="button"
          >
            {isPhoneCopied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          </button>
        </div>
        <div className={`${styles.contactFooterItem} ${styles.contactFooterPrimaryItem}`}>
          <Mail aria-hidden="true" />
          <a href={`mailto:${loanContact.email}`}>{loanContact.email}</a>
          <button
            aria-label={
              isEmailCopied
                ? t("คัดลอกอีเมลแล้ว", "Email copied")
                : t("คัดลอกอีเมล", "Copy email")
            }
            className={styles.contactFooterCopyButton}
            onClick={() => copyContactValue(loanContact.email, setIsEmailCopied)}
            title={
              isEmailCopied
                ? t("คัดลอกอีเมลแล้ว", "Email copied")
                : t("คัดลอกอีเมล", "Copy email")
            }
            type="button"
          >
            {isEmailCopied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          </button>
        </div>
        <div className={`${styles.contactFooterItem} ${styles.contactFooterTwoLineItem}`}>
          <MapPin aria-hidden="true" />
          <span>
            ชั้น 1 อาคารเทพรัตน์
            <br className={styles.contactFooterNarrowBreak} /> คณะพยาบาลศาสตร์ มช.
          </span>
        </div>
        <div className={`${styles.contactFooterItem} ${styles.contactFooterTwoLineItem}`}>
          <Clock3 aria-hidden="true" />
          <span>
            จันทร์-ศุกร์
            <br className={styles.contactFooterNarrowBreak} /> 08:30 - 16:30 น.
          </span>
        </div>
      </div>
    </footer>
  );
}
