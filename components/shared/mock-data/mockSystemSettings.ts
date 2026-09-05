// src/components/shared/mock-data/mockSystemSettings.ts

export type SystemBankAccount = {
  id: string;
  bankName: string;
  bankCode: "KTB" | "SCB" | "KBANK" | "BBL" | "GSB" | "BAY" | "TTB" | "OTHER";
  accountNumber: string;
  accountName: string;
  accountType: "ออมทรัพย์" | "กระแสรายวัน" | "ประจำ";
  branch: string;
  promptPayId?: string;
  qrImageSrc?: string;
  isPrimary: boolean;
  isActive: boolean;
  updatedAt: string;
  updatedBy: string;
  note?: string;
};

export type SystemAddressData = {
  facultyNameTh: string;
  facultyNameEn: string;
  departmentTh: string;
  departmentEn: string;
  taxId: string;
  building: string;
  streetAddress: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
  phone: string;
  phoneSecondary?: string;
  internalExt?: string;
  fax?: string;
  email: string;
  officialWebsite?: string;
  lineOfficial?: string;
  openingHours: string;
  closedDaysNote: string;
  submissionLocation: string;
  contractHeaderFormat: string;
  updatedAt: string;
  updatedBy: string;
};

export const initialSystemBankAccounts: SystemBankAccount[] = [
  {
    id: "bank-001",
    bankName: "ธนาคารกรุงไทย",
    bankCode: "KTB",
    accountNumber: "521-0-12345-6",
    accountName: "คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่ (เงินกู้ยืมฉุกเฉิน)",
    accountType: "ออมทรัพย์",
    branch: "สาขามหาวิทยาลัยเชียงใหม่",
    promptPayId: "0994000164901",
    qrImageSrc: "/mock-payment-qr.svg",
    isPrimary: true,
    isActive: true,
    updatedAt: "05 ก.ย. 2569 10:15 น.",
    updatedBy: "SuperAdmin (SA-001)",
    note: "บัญชีหลักสำหรับรับเงินคืนกองทุนเงินยืมฉุกเฉินและออก QR Code อัตโนมัติให้นักศึกษา",
  },
  {
    id: "bank-002",
    bankName: "ธนาคารไทยพาณิชย์",
    bankCode: "SCB",
    accountNumber: "667-2-98765-4",
    accountName: "มหาวิทยาลัยเชียงใหม่ (คณะพยาบาลศาสตร์)",
    accountType: "กระแสรายวัน",
    branch: "สาขาถนนสุเทพ เชียงใหม่",
    promptPayId: "0994000164901",
    qrImageSrc: "/mock-payment-qr.svg",
    isPrimary: false,
    isActive: true,
    updatedAt: "28 ส.ค. 2569 16:40 น.",
    updatedBy: "SuperAdmin (SA-001)",
    note: "บัญชีสำรองสำหรับการโอนเบิกจ่ายเงินกู้ยืมเข้าบัญชีนักศึกษา",
  },
  {
    id: "bank-003",
    bankName: "ธนาคารกสิกรไทย",
    bankCode: "KBANK",
    accountNumber: "045-8-76543-2",
    accountName: "กองทุนเพื่อการศึกษานักศึกษาพยาบาล มช.",
    accountType: "ออมทรัพย์",
    branch: "สาขาสี่แยกสนามบิน เชียงใหม่",
    promptPayId: "",
    qrImageSrc: "",
    isPrimary: false,
    isActive: false,
    updatedAt: "15 ก.ค. 2569 09:00 น.",
    updatedBy: "SuperAdmin (SA-001)",
    note: "บัญชีเงินบริจาคสมทบกองทุน ปิดการใช้งานชั่วคราวสำหรับการรับชำระเงินในแอป",
  },
];

export const initialSystemAddress: SystemAddressData = {
  facultyNameTh: "คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่",
  facultyNameEn: "Faculty of Nursing, Chiang Mai University",
  departmentTh: "หน่วยพัฒนาคุณภาพนักศึกษาและศิษย์เก่าสัมพันธ์",
  departmentEn: "Student Quality Development and Alumni Relations Unit",
  taxId: "0994000164901",
  building: "อาคาร 1 (อาคารเทพรัตน์) ชั้น 1",
  streetAddress: "110 ถนนอินทวโรรส",
  subDistrict: "ตำบลศรีภูมิ",
  district: "อำเภอเมืองเชียงใหม่",
  province: "จังหวัดเชียงใหม่",
  postalCode: "50200",
  phone: "053-935025",
  phoneSecondary: "053-945025",
  internalExt: "5025, 5026",
  fax: "053-217145",
  email: "loan@nurse.cmu.ac.th",
  officialWebsite: "https://www.nurse.cmu.ac.th",
  lineOfficial: "@nurse_cmu_loan",
  openingHours: "วันจันทร์ - วันศุกร์ เวลา 08:30 - 16:30 น.",
  closedDaysNote: "เว้นวันหยุดราชการและวันหยุดนักขัตฤกษ์",
  submissionLocation: "จุดรับเอกสารคำร้องเงินกู้ยืม ชั้น 1 อาคารเทพรัตน์ คณะพยาบาลศาสตร์ มช.",
  contractHeaderFormat:
    "คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่ 110 ถ.อินทวโรรส ต.ศรีภูมิ อ.เมือง จ.เชียงใหม่ 50200",
  updatedAt: "05 ก.ย. 2569 11:20 น.",
  updatedBy: "SuperAdmin (SA-001)",
};

/**
 * Helper to simulate network latency for realistic data retrieval UX
 */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// In-memory runtime cache so updates persist across tab switches in the same session
let cachedBankAccounts: SystemBankAccount[] = JSON.parse(JSON.stringify(initialSystemBankAccounts));
let cachedAddress: SystemAddressData = JSON.parse(JSON.stringify(initialSystemAddress));

/**
 * Asynchronously fetch system bank accounts
 */
export async function getSystemBankAccounts(): Promise<SystemBankAccount[]> {
  await delay(300);
  return JSON.parse(JSON.stringify(cachedBankAccounts));
}

/**
 * Asynchronously save / update system bank accounts
 */
export async function saveSystemBankAccounts(
  accounts: SystemBankAccount[],
  actor = "SuperAdmin",
): Promise<SystemBankAccount[]> {
  await delay(350);
  const now = new Date();
  const dateStr = `${now.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} ${now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.`;

  cachedBankAccounts = accounts.map((acc) => ({
    ...acc,
    updatedAt: dateStr,
    updatedBy: actor,
  }));

  return JSON.parse(JSON.stringify(cachedBankAccounts));
}

/**
 * Asynchronously fetch system address data
 */
export async function getSystemAddress(): Promise<SystemAddressData> {
  await delay(300);
  return JSON.parse(JSON.stringify(cachedAddress));
}

/**
 * Asynchronously save / update system address data
 */
export async function saveSystemAddress(
  data: SystemAddressData,
  actor = "SuperAdmin",
): Promise<SystemAddressData> {
  await delay(350);
  const now = new Date();
  const dateStr = `${now.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} ${now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.`;

  cachedAddress = {
    ...data,
    updatedAt: dateStr,
    updatedBy: actor,
  };

  return JSON.parse(JSON.stringify(cachedAddress));
}
