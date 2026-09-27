"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Building,
  Landmark,
  Phone,
  Mail,
  Clock,
  Lock,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  X,
  MapPin,
  CreditCard,
  ChevronDown,
  Check,
} from "lucide-react";
import ImageWithSkeleton from "@/components/shared/ImageWithSkeleton";
import {
  type SystemAddressData,
  type SystemBankAccount,
  getSystemAddress,
  saveSystemAddress,
  getSystemBankAccounts,
  saveSystemBankAccounts,
} from "@/components/shared/mock-data/mockSystemSettings";
import { fetchSystemSetting, saveSystemSetting } from "@/lib/system-settings-client";
import { tempLoanFormOptions } from "@/app/student/temp/tempMockData";

// รายชื่อธนาคารจากข้อมูลบัญชีธนาคารสำหรับรับเงินของนักศึกษา (tempLoanFormOptions.banks)
const studentBankOptions = tempLoanFormOptions.banks;

function bankCodeForName(bankName: string): SystemBankAccount["bankCode"] {
  const match = studentBankOptions.find((b) => b.label === bankName || b.value === bankName);
  if (!match) return "OTHER";
  const code = match.logoSrc.replace("/bank-logos/", "").replace(".png", "");
  const standardCodes = ["KTB", "SCB", "KBANK", "BBL", "GSB", "BAY", "TTB"];
  return standardCodes.includes(code) ? (code as SystemBankAccount["bankCode"]) : "OTHER";
}

// ฟังก์ชันสำหรับ Auto Map วันภาษาไทย -> อังกฤษ
const translateDays = (thText: string) => {
  let enText = thText;
  const dayMap: Record<string, string> = {
    วันจันทร์: "Monday",
    จันทร์: "Monday",
    วันอังคาร: "Tuesday",
    อังคาร: "Tuesday",
    วันพุธ: "Wednesday",
    พุธ: "Wednesday",
    วันพฤหัสบดี: "Thursday",
    พฤหัสบดี: "Thursday",
    วันศุกร์: "Friday",
    ศุกร์: "Friday",
    วันเสาร์: "Saturday",
    เสาร์: "Saturday",
    วันอาทิตย์: "Sunday",
    อาทิตย์: "Sunday",
    " ถึง ": " to ",
    "-": "-",
    " และ ": " and ",
  };

  Object.keys(dayMap).forEach((thWord) => {
    const regex = new RegExp(thWord, "g");
    enText = enText.replace(regex, dayMap[thWord]);
  });

  return enText;
};

// ฟังก์ชันสำหรับ Auto Map เวลาภาษาไทย -> อังกฤษ (ลบคำว่า เวลา, น.)
const translateTime = (thTime: string) => {
  return thTime.replace(/เวลา/g, "").replace(/น\./g, "").trim();
};

export interface SystemContactInfoData {
  // ข้อมูลธนาคาร
  bankName: string;
  bankCode: SystemBankAccount["bankCode"];
  accountName: string;
  accountNumber: string;

  // ที่อยู่และการติดต่อ
  facultyNameTh: string; // Fixed: คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่
  submissionLocation: string; // จุดติดต่อเจ้าหน้าที่ (ภาษาไทย)
  submissionLocationEn: string; // Contact Location (English)
  phone: string; // เบอร์โทรศัพท์หลัก
  internalExt: string; // เบอร์ต่อภายใน (Ext.)
  email: string; // อีเมลติดต่อทางการ
  openingDaysTh: string; // วันทำการ (ภาษาไทย)
  openingDaysEn: string; // Working Days (English)
  openingTimeTh: string; // เวลาทำการ (ภาษาไทย)
  openingTimeEn: string; // Working Hours (English)
  closedDaysNote: string; // หมายเหตุวันหยุด
  updatedAt: string;
  updatedBy: string;
}

const FIXED_FACULTY_NAME = "คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่";

async function loadCombinedData(): Promise<{
  data: SystemContactInfoData;
  rawBankAccounts: SystemBankAccount[];
  rawAddress: SystemAddressData;
}> {
  const [bankAccounts, addressData, stored] = await Promise.all([
    getSystemBankAccounts(),
    getSystemAddress(),
    fetchSystemSetting(),
  ]);

  const primaryAcc = bankAccounts.find((a) => a.isPrimary) || bankAccounts[0];
  const bankName = stored.bankName || primaryAcc?.bankName || "ธนาคารกรุงไทย";
  const bankCode = bankCodeForName(bankName);
  const accountName = stored.accountName || primaryAcc?.accountName || FIXED_FACULTY_NAME;
  const accountNumber = stored.accountNumber || primaryAcc?.accountNumber || "";

  const openingDaysTh = addressData.openingHours?.split(" เวลา ")[0] || "วันจันทร์ - วันศุกร์";
  const openingTimeTh = addressData.openingHours?.split(" เวลา ")[1] || "08:30 - 16:30 น.";

  const combined: SystemContactInfoData = {
    bankName,
    bankCode,
    accountName,
    accountNumber,
    facultyNameTh: FIXED_FACULTY_NAME,
    submissionLocation: stored.contactLocationTh || addressData.submissionLocation || "",
    submissionLocationEn: stored.contactLocationEn || "",
    phone: stored.contactPhone || addressData.phone || "",
    internalExt: stored.contactExt ?? addressData.internalExt ?? "",
    email: stored.contactEmail || addressData.email || "",
    openingDaysTh,
    openingDaysEn: translateDays(openingDaysTh),
    openingTimeTh,
    openingTimeEn: translateTime(openingTimeTh),
    closedDaysNote: addressData.closedDaysNote || "",
    updatedAt: addressData.updatedAt || primaryAcc?.updatedAt || "เมื่อสักครู่",
    updatedBy: addressData.updatedBy || primaryAcc?.updatedBy || "SuperAdmin",
  };

  return {
    data: combined,
    rawBankAccounts: bankAccounts,
    rawAddress: addressData,
  };
}

export default function SystemContactInfoTab() {
  const [initialData, setInitialData] = useState<SystemContactInfoData | null>(null);
  const [formData, setFormData] = useState<SystemContactInfoData | null>(null);
  const [rawBankAccounts, setRawBankAccounts] = useState<SystemBankAccount[]>([]);
  const [rawAddress, setRawAddress] = useState<SystemAddressData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bank Dropdown state
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const bankDropdownRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  useEffect(() => {
    let isMounted = true;

    loadCombinedData()
      .then(({ data, rawBankAccounts: banks, rawAddress: addr }) => {
        if (isMounted) {
          setInitialData(data);
          setFormData(data);
          setRawBankAccounts(banks);
          setRawAddress(addr);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to load contact and bank info:", err);
          setErrorMessage("ไม่สามารถโหลดข้อมูลและการติดต่อได้ กรุณาลองใหม่อีกครั้ง");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Close bank dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bankDropdownRef.current && !bankDropdownRef.current.contains(event.target as Node)) {
        setIsBankDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setErrorMessage(null);
      const { data, rawBankAccounts: banks, rawAddress: addr } = await loadCombinedData();
      setInitialData(data);
      setFormData(data);
      setRawBankAccounts(banks);
      setRawAddress(addr);
      setFormErrors({});
      showToast("รีเฟรชข้อมูลเรียบร้อยแล้ว");
    } catch (err) {
      console.error("Failed to refresh data:", err);
      setErrorMessage("ไม่สามารถโหลดข้อมูลและการติดต่อได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsRefreshing(false);
    }
  };

  const isDirty = useMemo(() => {
    if (!initialData || !formData) return false;
    return JSON.stringify(initialData) !== JSON.stringify(formData);
  }, [initialData, formData]);

  const handleFieldChange = (field: keyof SystemContactInfoData, value: string) => {
    if (!formData) return;

    const newFormData = { ...formData, [field]: value };

    if (field === "openingDaysTh") {
      newFormData.openingDaysEn = translateDays(value);
    }
    if (field === "openingTimeTh") {
      newFormData.openingTimeEn = translateTime(value);
    }

    setFormData(newFormData);

    // Clear error for field
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleReset = () => {
    if (initialData) {
      setFormData(JSON.parse(JSON.stringify(initialData)));
      setFormErrors({});
      showToast("คืนค่าข้อมูลเดิมเรียบร้อยแล้ว");
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData) return;

    // Validation
    const errors: Record<string, string> = {};
    if (!formData.bankName.trim()) errors.bankName = "กรุณาระบุชื่อธนาคาร";
    if (!formData.accountNumber.trim()) {
      errors.accountNumber = "กรุณาระบุเลขที่บัญชี";
    } else if (!/^[0-9-]+$/.test(formData.accountNumber.trim())) {
      errors.accountNumber = "เลขที่บัญชีต้องประกอบด้วยตัวเลขหรือเครื่องหมายขีด (-) เท่านั้น";
    }
    if (!formData.accountName.trim()) errors.accountName = "กรุณาระบุชื่อบัญชี";
    if (!formData.submissionLocation.trim()) {
      errors.submissionLocation = "กรุณาระบุจุดติดต่อเจ้าหน้าที่ (ภาษาไทย)";
    }
    if (!formData.phone.trim()) {
      errors.phone = "กรุณาระบุเบอร์โทรศัพท์หลัก";
    }
    if (!formData.email.trim()) {
      errors.email = "กรุณาระบุอีเมลติดต่อทางการ";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }
    if (!formData.openingDaysTh.trim()) {
      errors.openingDaysTh = "กรุณาระบุวันทำการ";
    }
    if (!formData.openingTimeTh.trim()) {
      errors.openingTimeTh = "กรุณาระบุเวลาทำการ";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast("กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Update database system_setting row
      const saveError = await saveSystemSetting({
        bankName: formData.bankName.trim(),
        accountName: formData.accountName.trim(),
        accountNumber: formData.accountNumber.trim(),
        contactLocationTh: formData.submissionLocation.trim(),
        contactLocationEn: formData.submissionLocationEn?.trim() ?? "",
        contactPhone: formData.phone.trim(),
        contactExt: formData.internalExt?.trim() ?? "",
        contactEmail: formData.email.trim(),
      });

      if (saveError) {
        showToast(saveError);
        return;
      }

      // 2. Update mock system address
      const combinedOpeningHours = `${formData.openingDaysTh.trim()} เวลา ${formData.openingTimeTh.trim()}`;
      const updatedAddress = await saveSystemAddress({
        ...(rawAddress || {
          facultyNameTh: FIXED_FACULTY_NAME,
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
          contractHeaderFormat:
            "คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่ 110 ถ.อินทวโรรส ต.ศรีภูมิ อ.เมือง จ.เชียงใหม่ 50200",
        }),
        facultyNameTh: FIXED_FACULTY_NAME,
        phone: formData.phone.trim(),
        internalExt: formData.internalExt?.trim() ?? "",
        email: formData.email.trim(),
        openingHours: combinedOpeningHours,
        closedDaysNote: formData.closedDaysNote.trim(),
        submissionLocation: formData.submissionLocation.trim(),
        updatedAt: "",
        updatedBy: "SuperAdmin",
      });

      // 3. Update mock bank accounts list
      if (rawBankAccounts.length > 0) {
        const primaryId = rawBankAccounts.find((a) => a.isPrimary)?.id || rawBankAccounts[0].id;
        const updatedBankAccounts = rawBankAccounts.map((acc) => {
          if (acc.id === primaryId) {
            return {
              ...acc,
              bankName: formData.bankName.trim(),
              bankCode: formData.bankCode,
              accountName: formData.accountName.trim(),
              accountNumber: formData.accountNumber.trim(),
            };
          }
          return acc;
        });
        await saveSystemBankAccounts(updatedBankAccounts);
        setRawBankAccounts(updatedBankAccounts);
      }

      const now = new Date();
      const dateStr = `${now.toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })} ${now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.`;

      const savedState: SystemContactInfoData = {
        ...formData,
        facultyNameTh: FIXED_FACULTY_NAME,
        updatedAt: updatedAddress.updatedAt || dateStr,
        updatedBy: "SuperAdmin",
      };

      setInitialData(savedState);
      setFormData(savedState);
      setRawAddress(updatedAddress);
      showToast("บันทึกข้อมูลและการติดต่อเรียบร้อยแล้ว");
    } catch (err) {
      console.error("Failed to save contact and bank info:", err);
      showToast("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSaving(false);
    }
  };

  // Find matching bank in student bank options
  const selectedBank = studentBankOptions.find(
    (b) => b.label === formData?.bankName || b.value === formData?.bankName,
  );
  const isCustomBank = formData?.bankCode === "OTHER" || (!selectedBank && Boolean(formData?.bankName));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3.5 rounded-xl shadow-xl border border-gray-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-white ml-2"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      ) : errorMessage || !formData ? (
        <div className="bg-white rounded-2xl border border-red-200 p-10 text-center shadow-sm">
          <AlertCircle size={36} className="text-red-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900">
            {errorMessage || "เกิดข้อผิดพลาดในการโหลดข้อมูล"}
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">ไม่สามารถแสดงข้อมูลและการติดต่อได้</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-[#ea580c] text-white text-sm font-bold rounded-lg hover:bg-[#c2410c] transition-colors"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ===================================================
              ส่วนที่ 1: ข้อมูลธนาคาร
          =================================================== */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
            <div className="pb-5 mb-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Landmark size={22} className="text-[#ea580c]" />
                  ข้อมูลธนาคาร
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  บัญชีหลักสำหรับรับเงินคืนกองทุน แสดงให้นักศึกษาเห็นในระบบเพื่อชำระเงินคืน
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* ชื่อธนาคาร (ใช้ตัวเลือกธนาคารของนักศึกษา) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ชื่อธนาคาร <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {/* Custom Bank Selector with logos from student bank options */}
                  <div className="relative" ref={bankDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-left transition-all hover:border-gray-400"
                    >
                      <div className="flex items-center gap-3">
                        {selectedBank ? (
                          <>
                            <ImageWithSkeleton
                              src={selectedBank.logoSrc}
                              alt={selectedBank.label}
                              width={24}
                              height={24}
                              className="rounded-full shrink-0"
                              containerClassName="size-6 shrink-0 rounded-full"
                            />
                            <div>
                              <span className="font-medium text-gray-900">{selectedBank.label}</span>
                              <span className="text-xs text-gray-500 ml-2 hidden sm:inline">
                                ({selectedBank.labelEn})
                              </span>
                            </div>
                          </>
                        ) : isCustomBank ? (
                          <>
                            <Landmark size={20} className="text-[#ea580c] shrink-0" />
                            <span className="font-medium text-gray-900">
                              {formData.bankName ? `${formData.bankName} (ธนาคารอื่นๆ)` : "ระบุชื่อธนาคารอื่นๆ"}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400">เลือกธนาคาร</span>
                        )}
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-gray-400 transition-transform duration-200 ${
                          isBankDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {isBankDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-gray-50">
                        {studentBankOptions.map((bank) => {
                          const isSelected = formData.bankName === bank.label;
                          return (
                            <button
                              key={bank.value}
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  bankName: bank.label,
                                  bankCode: bankCodeForName(bank.label),
                                });
                                setIsBankDropdownOpen(false);
                                if (formErrors.bankName) {
                                  setFormErrors((prev) => {
                                    const next = { ...prev };
                                    delete next.bankName;
                                    return next;
                                  });
                                }
                              }}
                              className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-orange-50/60 transition-colors ${
                                isSelected ? "bg-orange-50 font-semibold" : ""
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <ImageWithSkeleton
                                  src={bank.logoSrc}
                                  alt={bank.label}
                                  width={24}
                                  height={24}
                                  className="rounded-full shrink-0"
                                  containerClassName="size-6 shrink-0 rounded-full"
                                />
                                <div>
                                  <div className="text-gray-900 font-medium">{bank.label}</div>
                                  <div className="text-xs text-gray-400">{bank.labelEn}</div>
                                </div>
                              </div>
                              {isSelected && <Check size={16} className="text-[#ea580c]" />}
                            </button>
                          );
                        })}

                        {/* ธนาคารอื่นๆ */}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              bankCode: "OTHER",
                              bankName: isCustomBank ? formData.bankName : "",
                            });
                            setIsBankDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-orange-50/60 transition-colors ${
                            formData.bankCode === "OTHER" ? "bg-orange-50 font-semibold" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Landmark size={22} className="text-gray-500 shrink-0" />
                            <div>
                              <div className="text-gray-900 font-medium">ธนาคารอื่นๆ</div>
                              <div className="text-xs text-gray-400">ระบุชื่อธนาคารเอง</div>
                            </div>
                          </div>
                          {formData.bankCode === "OTHER" && (
                            <Check size={16} className="text-[#ea580c]" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ระบุชื่อธนาคารเองหากเลือก ธนาคารอื่นๆ */}
                  {isCustomBank && (
                    <div>
                      <input
                        type="text"
                        value={formData.bankName}
                        onChange={(e) => handleFieldChange("bankName", e.target.value)}
                        placeholder="ระบุชื่อธนาคาร เช่น ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร"
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                    </div>
                  )}
                  {formErrors.bankName && (
                    <p className="text-xs text-red-500">{formErrors.bankName}</p>
                  )}
                </div>
              </div>

              {/* ชื่อเลขบัญชี (ชื่อบัญชี) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ชื่อเลขบัญชี / ชื่อบัญชี <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่ (เงินกู้ยืมฉุกเฉิน)"
                  value={formData.accountName}
                  onChange={(e) => handleFieldChange("accountName", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                {formErrors.accountName && (
                  <p className="text-xs text-red-500 mt-1.5">{formErrors.accountName}</p>
                )}
              </div>

              {/* หมายเลขบัญชี */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  หมายเลขบัญชี <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น 521-0-12345-6"
                  value={formData.accountNumber}
                  onChange={(e) => handleFieldChange("accountNumber", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                {formErrors.accountNumber && (
                  <p className="text-xs text-red-500 mt-1.5">{formErrors.accountNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* ===================================================
              ส่วนที่ 2: ที่อยู่และการติดต่อ
          =================================================== */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
            <div className="pb-5 mb-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Building size={22} className="text-[#ea580c]" />
                  ที่อยู่และการติดต่อ
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  ข้อมูลหน่วยงานสังกัด จุดติดต่อ เวลาทำการ และช่องทางติดต่อเจ้าหน้าที่
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* ข้อมูลคณะและหน่วยงานสังกัด - FIXED ไม่สามารถแก้ไขได้ */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-gray-700">
                    ข้อมูลคณะและหน่วยงานสังกัด <span className="text-red-500">*</span>
                  </label>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                    <Lock size={12} className="text-gray-500" />
                    ค่าคงที่ของระบบ (ไม่สามารถแก้ไขได้)
                  </span>
                </div>
                <input
                  type="text"
                  value={FIXED_FACULTY_NAME}
                  readOnly
                  disabled
                  className="w-full px-4 py-2.5 bg-gray-100/80 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 cursor-not-allowed select-none"
                />
              </div>

              {/* จุดติดต่อเจ้าหน้าที่ (TH - EN) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    จุดติดต่อเจ้าหน้าที่ (ภาษาไทย) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.submissionLocation}
                    onChange={(e) => handleFieldChange("submissionLocation", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น จุดรับเอกสารคำร้องเงินกู้ยืม ชั้น 1 อาคารเทพรัตน์ คณะพยาบาลศาสตร์ มช."
                  />
                  {formErrors.submissionLocation && (
                    <p className="text-xs text-red-500 mt-1.5">{formErrors.submissionLocation}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Contact Location (English)
                  </label>
                  <input
                    type="text"
                    value={formData.submissionLocationEn}
                    onChange={(e) => handleFieldChange("submissionLocationEn", e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="e.g. Loan Petition Counter, 1st Floor, Theprat Building"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 my-2"></div>

              {/* เบอร์โทรศัพท์หลัก, เบอร์ต่อภายใน, อีเมลติดต่อทางการ */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    เบอร์โทรศัพท์หลัก <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น 053-935025"
                  />
                  {formErrors.phone && (
                    <p className="text-xs text-red-500 mt-1.5">{formErrors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    เบอร์ต่อภายใน (Ext.)
                  </label>
                  <input
                    type="text"
                    value={formData.internalExt}
                    onChange={(e) => handleFieldChange("internalExt", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น 5025, 5026"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    อีเมลติดต่อทางการ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น loan@nurse.cmu.ac.th"
                  />
                  {formErrors.email && (
                    <p className="text-xs text-red-500 mt-1.5">{formErrors.email}</p>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 my-2"></div>

              {/* วันทำการ และ เวลาทำการ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    วันทำการ (ภาษาไทย) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.openingDaysTh}
                    onChange={(e) => handleFieldChange("openingDaysTh", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น วันจันทร์ - วันศุกร์"
                  />
                  {formErrors.openingDaysTh && (
                    <p className="text-xs text-red-500 mt-1.5">{formErrors.openingDaysTh}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Working Days (Auto Map)
                  </label>
                  <input
                    type="text"
                    value={formData.openingDaysEn}
                    onChange={(e) => handleFieldChange("openingDaysEn", e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="e.g. Monday - Friday"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    เวลาทำการ (ภาษาไทย) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.openingTimeTh}
                    onChange={(e) => handleFieldChange("openingTimeTh", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น 08:30 - 16:30 น."
                  />
                  {formErrors.openingTimeTh && (
                    <p className="text-xs text-red-500 mt-1.5">{formErrors.openingTimeTh}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Working Hours (Auto Map)
                  </label>
                  <input
                    type="text"
                    value={formData.openingTimeEn}
                    onChange={(e) => handleFieldChange("openingTimeEn", e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="e.g. 08:30 - 16:30"
                  />
                </div>
              </div>

              {/* หมายเหตุวันหยุด */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  หมายเหตุวันหยุด
                </label>
                <input
                  type="text"
                  value={formData.closedDaysNote}
                  onChange={(e) => handleFieldChange("closedDaysNote", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  placeholder="เช่น เว้นวันหยุดราชการและวันหยุดนักขัตฤกษ์"
                />
              </div>
            </div>
          </div>

          {/* ===================================================
              ส่วนที่ 3: Live Preview ตัวอย่างการแสดงผลบนหน้าจอนักศึกษา
          =================================================== */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#ea580c]" />
                ตัวอย่างการแสดงผลบนหน้านักศึกษา
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Preview
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* บัญชีรับชำระเงิน */}
              <div className="bg-gradient-to-br from-orange-500/5 via-amber-500/5 to-orange-500/10 rounded-xl p-5 border border-orange-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <CreditCard size={16} className="text-[#ea580c]" />
                    บัญชีรับชำระเงินคืนกองทุน
                  </h4>
                  <div className="flex items-center gap-1.5 bg-orange-100/70 px-2 py-0.5 rounded-md">
                    {selectedBank?.logoSrc && (
                      <ImageWithSkeleton
                        src={selectedBank.logoSrc}
                        alt=""
                        width={16}
                        height={16}
                        className="rounded-full shrink-0"
                        containerClassName="size-4 shrink-0 rounded-full"
                      />
                    )}
                    <span className="text-[11px] font-semibold text-orange-700">
                      {formData.bankName || "ธนาคาร"}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-gray-700">
                  <div>
                    <span className="text-gray-500">ชื่อบัญชี: </span>
                    <span className="font-semibold text-gray-900">{formData.accountName || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">เลขที่บัญชี: </span>
                    <span className="font-mono font-bold text-orange-700 text-sm">
                      {formData.accountNumber || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* ติดต่อเจ้าหน้าที่กองทุน */}
              <div className="bg-gradient-to-br from-slate-500/5 via-gray-500/5 to-slate-500/10 rounded-xl p-5 border border-gray-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-[#ea580c]" />
                    ติดต่อเจ้าหน้าที่กองทุน
                  </h4>
                  <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md truncate max-w-[180px]">
                    {FIXED_FACULTY_NAME}
                  </span>
                </div>
                <div className="space-y-2 text-xs text-gray-700">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400 shrink-0" />
                    <span className="font-semibold text-gray-900">{formData.phone || "-"}</span>
                    {formData.internalExt && (
                      <span className="text-gray-500">(ต่อ {formData.internalExt})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400 shrink-0" />
                    <span className="text-gray-800 break-all">{formData.email || "-"}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <span className="text-gray-800 leading-relaxed">
                      {formData.submissionLocation || "-"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-gray-800">
                        {formData.openingDaysTh || "-"} เวลา {formData.openingTimeTh || "-"}
                      </span>
                      {formData.closedDaysNote && (
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {formData.closedDaysNote}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================
              Bottom Actions Bar
          =================================================== */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 shadow-sm gap-4">
            <div className="text-xs text-gray-500 w-full sm:w-auto text-center sm:text-left">
              <span>ปรับปรุงล่าสุดเมื่อ: </span>
              <span className="font-semibold text-gray-700">{formData.updatedAt}</span>
              <span className="mx-1.5 hidden sm:inline">·</span>
              <br className="sm:hidden" />
              <span className="hidden sm:inline">โดย: </span>
              <span className="font-semibold text-gray-700">{formData.updatedBy}</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-200 border border-gray-200 rounded-lg transition-colors disabled:opacity-50"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw
                  size={15}
                  className={isRefreshing ? "animate-spin text-[#ea580c]" : ""}
                />
                <span className="hidden sm:inline">รีเฟรช</span>
              </button>

              {isDirty && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  คืนค่าเดิม
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={isSaving}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 text-sm font-bold text-white bg-[#ea580c] hover:bg-[#c2410c] rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
