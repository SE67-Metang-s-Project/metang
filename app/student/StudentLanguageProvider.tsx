"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type StudentLanguage = "th" | "en";

const studentTranslations: Record<string, string> = {
  "แบบร่าง": "Draft",
  "แก้ไขเอกสาร": "Revise",
  "รออาจารย์": "Advisor pending",
  "รอเจ้าหน้าที่": "Admin pending",
  "รอผู้บริหาร": "Executive pending",
  "รอยืนยันการโอนเงิน": "Transfer pending",
  "กำลังชำระ": "Repaying",
  "ชำระแล้ว": "Paid",
  "ไม่อนุมัติโดยอาจารย์": "Advisor rejected",
  "ไม่อนุมัติโดยเจ้าหน้าที่": "Admin rejected",
  "ไม่อนุมัติโดยผู้บริหาร": "Executive rejected",
  "ยกเลิกคำร้อง": "Cancelled",
  "อยู่ระหว่างชำระคืน": "Repayment in progress",
  "ชำระตรงเวลา": "Paid on time",
  "ปฏิเสธ · ผู้บริหาร": "Executive rejected",
  "รอยืนยันการรับเงิน": "Transfer pending",
  "รอแก้ไขเอกสาร": "Revise",
  "รออาจารย์ที่ปรึกษา": "Advisor pending",
  "ชำระเสร็จสิ้น": "Paid",
  "ค่าเทอมภาคเรียนที่ 1/2569": "Tuition fee, semester 1/2026",
  "ค่าเทอมภาคเรียนที่ 2/2568": "Tuition fee, semester 2/2025",
  "ค่าใช้จ่ายเกี่ยวกับการศึกษา": "Education-related expenses",
  "ชำระเสร็จสิ้นเมื่อ": "Paid on",
  "อีก 15 วันครบกำหนด": "Due in 15 days",
  "อีก 45 วันครบกำหนด": "Due in 45 days",
  "ธนาคารกรุงไทย": "Krung Thai Bank",
  "ธนาคารกสิกรไทย": "Kasikornbank",
  "ธนาคารไทยพาณิชย์": "Siam Commercial Bank",
  "ธนาคารกรุงเทพ": "Bangkok Bank",
  "ธนาคารกรุงศรีอยุธยา": "Krungsri Bank",
  "ธนาคารทหารไทยธนชาต": "TMBThanachart Bank",
  "ธนาคารออมสิน": "Government Savings Bank",
  "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)": "BAAC",
  "ธนาคารอาคารสงเคราะห์ (ธอส.)": "Government Housing Bank",
  "ธนาคารยูโอบี": "United Overseas Bank",
  "ธนาคารเกียรตินาคินภัทร": "Kiatnakin Phatra Bank",
  "ธนาคารซีไอเอ็มบี ไทย": "CIMB Thai Bank",
  "ธนาคารทิสโก้": "TISCO Bank",
  "คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่": "Faculty of Nursing, Chiang Mai University",
  "พยาบาลศาสตรบัณฑิต": "Bachelor of Nursing Science",
  "สถานการณ์ทางการเงิน": "Financial circumstances",
  "ตรวจสอบสำเร็จ": "Verified",
  "ปริญญาตรี": "Bachelor's degree",
  "ปริญญาโท": "Master's degree",
  "ปริญญาเอก": "Doctoral degree",
  "ประกาศนียบัตรผู้ช่วยพยาบาล": "Nursing assistant certificate",
  "ชั้นปีที่": "Year",
  "รออาจารย์ที่ปรึกษาพิจารณา": "Advisor pending",
  "รอเจ้าหน้าที่ตรวจสอบ": "Admin pending",
  "รอผู้บริหารอนุมัติ": "Executive pending",
  "อาจารย์พิจารณาคำร้อง": "Advisor reviewing request",
  "อาจารย์ที่ปรึกษาพิจารณาคำร้อง": "Advisor reviewing request",
  "เจ้าหน้าที่ตรวจสอบเอกสาร": "Admin reviewing documents",
  "ผู้บริหารพิจารณาอนุมัติคำร้อง": "Executive reviewing request",
  "เจ้าหน้าที่การเงินยืนยันการโอนเงิน": "Admin confirming transfer",
  "ได้รับเงินกู้และเริ่มชำระคืน": "Loan received; repayment begins",
  "กำลังดำเนินการ": "In progress",
  "ยื่นคำร้องกู้ยืมเงิน": "Loan request submitted",
  "อาจารย์ที่ปรึกษาพิจารณาเห็นชอบ": "Advisor approved the request",
  "เจ้าหน้าที่ตรวจสอบเอกสารผ่านการอนุมัติ": "Admin approved the documents",
  "ผู้บริหารอนุมัติคำร้องกู้ยืม": "Executive approved the loan request",
  "ส่งคำร้องกู้ยืม": "Loan request submitted",
  "อาจารย์ที่ปรึกษาอนุมัติ": "Advisor approved the request",
  "ผู้บริหารพิจารณาอนุมัติ": "Executive approved the request",
  "อาจารย์ที่ปรึกษาส่งกลับแก้ไข": "Advisor returned the request for revision",
  "เจ้าหน้าที่ส่งกลับแก้ไข": "Admin returned the request for revision",
  "ผู้บริหารส่งกลับแก้ไขให้เจ้าหน้าที่ตรวจสอบใหม่": "Executive returned the request for review",
  "อาจารย์ที่ปรึกษาไม่อนุมัติคำร้อง": "Advisor rejected the request",
  "เจ้าหน้าที่ไม่อนุมัติคำร้อง": "Admin rejected the request",
  "ผู้บริหารไม่อนุมัติคำร้อง": "Executive rejected the request",
  "ความคิดเห็นของอาจารย์ที่ปรึกษา": "Advisor's comment",
  "ความคิดเห็นของเจ้าหน้าที่": "Admin's comment",
  "ความคิดเห็นของผู้บริหาร": "Executive's comment",
  "ข้อความจากอาจารย์ที่ปรึกษา": "Message from advisor",
  "ข้อความจากเจ้าหน้าที่": "Message from admin",
  "ข้อความจากผู้บริหาร": "Message from executive",
  "เหตุผลที่ไม่อนุมัติ": "Reason for rejection",
  "นักศึกษา": "Student",
  "อาจารย์ที่ปรึกษา": "Advisor",
  "เจ้าหน้าที่": "Admin",
  "ผู้บริหาร": "Executive",
  "เจ้าหน้าที่โอนเงิน จำนวน": "Admin transferred money:",
  "ธนาคาร": "Bank",
  "เลขที่บัญชี": "Account number",
  "ชื่อบัญชี": "Account name",
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
    .replace("ชั้นปีที่", "Year")
    .replace(" น.", "")
    .replace(/\b25(\d{2})\b/g, (_, year: string) => String(2500 + Number(year) - 543));

  return Object.entries(studentTranslations)
    .sort(([thaiA], [thaiB]) => thaiB.length - thaiA.length)
    .reduce(
      (text, [thai, english]) => text.replaceAll(thai, english),
      translatedText,
    );
}

type StudentLanguageContextValue = {
  language: StudentLanguage;
  setLanguage: (language: StudentLanguage) => void;
  setDefaultLanguage: (language: StudentLanguage) => void;
  t: (thai: string, english: string) => string;
};

const StudentLanguageContext = createContext<StudentLanguageContextValue | null>(null);
const storageKey = "student-language";

function getStoredStudentLanguage(): StudentLanguage | null {
  if (typeof window === "undefined") return null;

  const savedLanguage = window.localStorage.getItem(storageKey);
  return savedLanguage === "en" || savedLanguage === "th" ? savedLanguage : null;
}

type StudentLanguageProviderProps = {
  children: React.ReactNode;
  defaultLanguage?: StudentLanguage;
};

export function StudentLanguageProvider({ children, defaultLanguage = "th" }: StudentLanguageProviderProps) {
  const [hasSavedLanguagePreference, setHasSavedLanguagePreference] = useState(
    () => getStoredStudentLanguage() !== null,
  );
  const [language, setLanguage] = useState<StudentLanguage>(
    () => getStoredStudentLanguage() ?? defaultLanguage,
  );

  useEffect(() => {
    document.documentElement.dataset.studentLanguage = language;

    return () => {
      delete document.documentElement.dataset.studentLanguage;
    };
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: (nextLanguage: StudentLanguage) => {
        window.localStorage.setItem(storageKey, nextLanguage);
        setHasSavedLanguagePreference(true);
        setLanguage(nextLanguage);
      },
      setDefaultLanguage: (nextLanguage: StudentLanguage) => {
        if (!hasSavedLanguagePreference) setLanguage(nextLanguage);
      },
      t: (thai: string, english: string) => (language === "th" ? thai : english),
    }),
    [hasSavedLanguagePreference, language],
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
