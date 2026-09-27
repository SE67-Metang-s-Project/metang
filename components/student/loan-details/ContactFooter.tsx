"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, Copy, Headphones, Mail, MapPin, Phone } from "lucide-react";
import styles from "@/app/student/student.module.css";
import { useStudentLanguage } from "@/app/student/StudentLanguageProvider";

type ContactSettings = {
  contactLocationTh: string;
  contactLocationEn: string | null;
  contactPhone: string;
  contactExt: string | null;
  contactEmail: string;
  contactHoursTh: string;
  contactHoursEn: string;
  contactClosedTh: string;
  contactClosedEn: string;
};

function formatPhone(phone: string, extension: string | null, language: "th" | "en") {
  const formattedPhone = phone.replace(/^(0\d{2})(\d{3})(\d{3,4})$/, "$1-$2-$3");
  const formattedExtension = extension?.trim().replace(/[;,]+/g, "/").replace(/\s+/g, "");
  if (!formattedExtension) return formattedPhone;
  return `${formattedPhone} ${language === "th" ? "ต่อ" : "ext."} ${formattedExtension}`;
}

export default function ContactFooter() {
  const { language, t } = useStudentLanguage();
  const [contact, setContact] = useState<ContactSettings | null>(null);
  const [isPhoneCopied, setIsPhoneCopied] = useState(false);
  const [isEmailCopied, setIsEmailCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSystemContact = async () => {
      const stored = await fetch("/api/system-settings")
        .then((res) => (res.ok ? res.json() : null))
        .then((body) => body?.data ?? null)
        .catch(() => null);
      if (isMounted) setContact(stored);
    };

    void loadSystemContact();

    return () => {
      isMounted = false;
    };
  }, []);

  const phone = contact ? formatPhone(contact.contactPhone, contact.contactExt, language) : "—";
  const location = contact
    ? language === "th"
      ? contact.contactLocationTh
      : contact.contactLocationEn || contact.contactLocationTh
    : "—";
  const openingHours = contact ? (language === "th" ? contact.contactHoursTh : contact.contactHoursEn) : "—";
  const closedDays = contact
    ? language === "th"
      ? contact.contactClosedTh
      : contact.contactClosedEn
    : "";

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
          {t("ติดต่อเจ้าหน้าที่", "Contact")}
        </h2>
      </header>
      <div className={styles.contactFooterGrid}>
        <div className={`${styles.contactFooterItem} ${styles.contactFooterPrimaryItem}`}>
          <Phone aria-hidden="true" />
          {contact ? <a href={`tel:${contact.contactPhone}`}>{phone}</a> : <span>{phone}</span>}
          <button
            aria-label={
              isPhoneCopied
                ? t("คัดลอกเบอร์โทรศัพท์แล้ว", "Phone number copied")
                : t("คัดลอกเบอร์โทรศัพท์", "Copy phone number")
            }
            className={styles.contactFooterCopyButton}
            onClick={() => contact && copyContactValue(phone, setIsPhoneCopied)}
            disabled={!contact}
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
          {contact ? <a href={`mailto:${contact.contactEmail}`}>{contact.contactEmail}</a> : <span>—</span>}
          <button
            aria-label={
              isEmailCopied
                ? t("คัดลอกอีเมลแล้ว", "Email copied")
                : t("คัดลอกอีเมล", "Copy email")
            }
            className={styles.contactFooterCopyButton}
            onClick={() => contact && copyContactValue(contact.contactEmail, setIsEmailCopied)}
            disabled={!contact}
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
            {location}
          </span>
        </div>
        <div className={`${styles.contactFooterItem} ${styles.contactFooterTwoLineItem}`}>
          <Clock3 aria-hidden="true" />
          <span>
            {openingHours}
            {closedDays && <span className={styles.contactFooterClosedDays}>{closedDays}</span>}
          </span>
        </div>
      </div>
    </footer>
  );
}
