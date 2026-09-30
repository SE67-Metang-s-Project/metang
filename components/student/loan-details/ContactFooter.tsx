"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, Copy, Headphones, Mail, MapPin, Phone } from "lucide-react";
import { loanContact } from "@/app/student/studentMockData";
import {
  systemAddressUpdatedEvent,
} from "@/components/shared/mock-data/mockSystemSettings";
import styles from "@/app/student/student.module.css";
import { useStudentLanguage } from "@/app/student/StudentLanguageProvider";
import { withBasePath } from "@/lib/base-path";

type ContactFooterData = {
  phone: string;
  extension: string | null;
  email: string;
  locationTh: string;
  locationEn: string;
};

const OFFICE_HOURS = {
  th: "วันจันทร์ - วันศุกร์ เวลา 08:30 - 16:30 น.",
  en: "Monday - Friday, 08:30 AM - 04:30 PM",
};

const HOLIDAY_NOTE = {
  th: "เว้นวันหยุดราชการและวันหยุดนักขัตฤกษ์",
  en: "Closed on public holidays and official holidays.",
};

function formatOfficePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 9 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : value;
}

export default function ContactFooter() {
  const { t } = useStudentLanguage();
  const [contact, setContact] = useState<ContactFooterData>({
    phone: loanContact.phone,
    extension: null,
    email: loanContact.email,
    locationTh: loanContact.location,
    locationEn: loanContact.location,
  });
  const [isPhoneCopied, setIsPhoneCopied] = useState(false);
  const [isEmailCopied, setIsEmailCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSystemContact = async () => {
      const stored = await fetch(withBasePath("/api/system-settings"))
        .then((res) => (res.ok ? res.json() : null))
        .then((body) => body?.data ?? null)
        .catch(() => null);
      if (!isMounted) return;
      if (!stored) return;

      setContact({
        phone: formatOfficePhone(stored.contactPhone || loanContact.phone),
        extension: stored.contactExt || null,
        email: stored.contactEmail || loanContact.email,
        locationTh: stored.contactLocationTh || loanContact.location,
        locationEn: stored.contactLocationEn || stored.contactLocationTh || loanContact.location,
      });
    };

    void loadSystemContact();
    window.addEventListener(systemAddressUpdatedEvent, loadSystemContact);
    window.addEventListener("storage", loadSystemContact);

    return () => {
      isMounted = false;
      window.removeEventListener(systemAddressUpdatedEvent, loadSystemContact);
      window.removeEventListener("storage", loadSystemContact);
    };
  }, []);

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
          <a href={`tel:${contact.phone}`}>{contact.phone}</a>
          {contact.extension && (
            <span className={styles.contactFooterExtension}>
              {t(`(ต่อ ${contact.extension})`, `(Ext. ${contact.extension})`)}
            </span>
          )}
          <button
            aria-label={
              isPhoneCopied
                ? t("คัดลอกเบอร์โทรศัพท์แล้ว", "Phone number copied")
                : t("คัดลอกเบอร์โทรศัพท์", "Copy phone number")
            }
            className={styles.contactFooterCopyButton}
            onClick={() => copyContactValue(contact.phone, setIsPhoneCopied)}
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
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <button
            aria-label={
              isEmailCopied
                ? t("คัดลอกอีเมลแล้ว", "Email copied")
                : t("คัดลอกอีเมล", "Copy email")
            }
            className={styles.contactFooterCopyButton}
            onClick={() => copyContactValue(contact.email, setIsEmailCopied)}
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
            {t(contact.locationTh, contact.locationEn)}
          </span>
        </div>
        <div className={`${styles.contactFooterItem} ${styles.contactFooterTwoLineItem}`}>
          <Clock3 aria-hidden="true" />
          <span>
            {t(OFFICE_HOURS.th, OFFICE_HOURS.en)}
            <br />
            {t(HOLIDAY_NOTE.th, HOLIDAY_NOTE.en)}
          </span>
        </div>
      </div>
    </footer>
  );
}
