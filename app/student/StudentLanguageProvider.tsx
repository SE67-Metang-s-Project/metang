"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type StudentLanguage = "th" | "en";

const studentTranslations: Record<string, string> = {
  "อยู่ระหว่างชำระคืน": "Repayment in progress",
  "ชำระตรงเวลา": "Paid on time",
  "ปฏิเสธ · ผู้บริหาร": "Rejected by executive",
  "รอยืนยันการรับเงิน": "Awaiting transfer confirmation",
  "รอแก้ไขเอกสาร": "Document revision required",
  "รออาจารย์ที่ปรึกษา": "Awaiting advisor approval",
  "รอผู้บริหาร": "Awaiting executive approval",
  "รอเจ้าหน้าที่": "Awaiting staff review",
  "ชำระเสร็จสิ้น": "Repayment completed",
  "ค่าเทอมภาคเรียนที่ 1/2569": "Tuition fee, semester 1/2026",
  "ค่าเทอมภาคเรียนที่ 2/2568": "Tuition fee, semester 2/2025",
  "ค่าใช้จ่ายเกี่ยวกับการศึกษา": "Education-related expenses",
  "ชำระเสร็จสิ้นเมื่อ": "Paid on",
  "อีก 15 วันครบกำหนด": "Due in 15 days",
  "อีก 45 วันครบกำหนด": "Due in 45 days",
  "ธนาคารกรุงไทย": "Krung Thai Bank",
  "คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่": "Faculty of Nursing, Chiang Mai University",
  "สถานการณ์ทางการเงิน": "Financial circumstances",
  "ตรวจสอบสำเร็จ": "Verified",
};

const thaiMonths: Record<string, string> = {
  "ม.ค.": "Jan",
  "ก.พ.": "Feb",
  "มี.ค.": "Mar",
  "เม.ย.": "Apr",
  "พ.ค.": "May",
  "มิ.ย.": "Jun",
  "ก.ค.": "Jul",
  "ส.ค.": "Aug",
  "ก.ย.": "Sep",
  "ต.ค.": "Oct",
  "พ.ย.": "Nov",
  "ธ.ค.": "Dec",
};

export function localizeStudentContent(value: string, language: StudentLanguage) {
  if (language === "th") return value;

  const directTranslation = studentTranslations[value];
  if (directTranslation) return directTranslation;

  const translatedText = Object.entries(thaiMonths)
    .reduce((text, [thaiMonth, englishMonth]) => text.replaceAll(thaiMonth, englishMonth), value)
    .replace("ยื่นเมื่อ", "Submitted")
    .replace("ครบกำหนด", "Due")
    .replace("ชำระเมื่อ", "Paid")
    .replace("ตรวจสอบเมื่อ", "Verified")
    .replace(" น.", "")
    .replace(/\b25(\d{2})\b/g, (_, year: string) => String(2500 + Number(year) - 543));

  return Object.entries(studentTranslations).reduce(
    (text, [thai, english]) => text.replaceAll(thai, english),
    translatedText,
  );
}

type StudentLanguageContextValue = {
  language: StudentLanguage;
  setLanguage: (language: StudentLanguage) => void;
  t: (thai: string, english: string) => string;
};

const StudentLanguageContext = createContext<StudentLanguageContextValue | null>(null);
const storageKey = "student-language";

export function StudentLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<StudentLanguage>(() => {
    if (typeof window === "undefined") return "th";

    const savedLanguage = window.localStorage.getItem(storageKey);
    return savedLanguage === "en" ? "en" : "th";
  });

  const value = useMemo(
    () => ({
      language,
      setLanguage: (nextLanguage: StudentLanguage) => {
        window.localStorage.setItem(storageKey, nextLanguage);
        setLanguage(nextLanguage);
      },
      t: (thai: string, english: string) => (language === "th" ? thai : english),
    }),
    [language],
  );

  return <StudentLanguageContext.Provider value={value}>{children}</StudentLanguageContext.Provider>;
}

export function useStudentLanguage() {
  const context = useContext(StudentLanguageContext);

  if (!context) {
    throw new Error("useStudentLanguage must be used within StudentLanguageProvider");
  }

  return context;
}
