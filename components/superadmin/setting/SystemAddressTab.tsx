"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Building,
  Phone,
  Mail,
  Clock,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  X,
  MapPin,
} from "lucide-react";
import {
  type SystemAddressData,
  getSystemAddress,
  saveSystemAddress,
} from "@/components/shared/mock-data/mockSystemSettings";

// สร้าง Type ขยายเพิ่มเติมสำหรับฟิลด์ใหม่ (ภาษาอังกฤษ และวัน/เวลา)
export interface ExtendedSystemAddressData extends SystemAddressData {
  openingDaysTh?: string;
  openingDaysEn?: string;
  openingTimeTh?: string;
  openingTimeEn?: string;
  submissionLocationEn?: string; // เพิ่มฟิลด์จุดติดต่อภาษาอังกฤษ
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

export default function SystemAddressTab() {
  const [initialData, setInitialData] = useState<ExtendedSystemAddressData | null>(null);
  const [formData, setFormData] = useState<ExtendedSystemAddressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  useEffect(() => {
    let isMounted = true;

    getSystemAddress()
      .then((data) => {
        if (isMounted) {
          const extendedData: ExtendedSystemAddressData = {
            ...data,
            openingDaysTh: data.openingHours?.split(" เวลา ")[0] || "",
            openingTimeTh: data.openingHours?.split(" เวลา ")[1] || "",
            openingDaysEn: translateDays(data.openingHours?.split(" เวลา ")[0] || ""),
            openingTimeEn: translateTime(data.openingHours?.split(" เวลา ")[1] || ""),
            submissionLocationEn: (data as any).submissionLocationEn || "",
          };
          setInitialData(extendedData);
          setFormData(extendedData);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to load system address data:", err);
          setErrorMessage("ไม่สามารถโหลดข้อมูลที่อยู่ของระบบได้ กรุณาลองใหม่อีกครั้ง");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setErrorMessage(null);
      const data = await getSystemAddress();
      const extendedData: ExtendedSystemAddressData = {
        ...data,
        openingDaysTh: data.openingHours?.split(" เวลา ")[0] || "",
        openingTimeTh: data.openingHours?.split(" เวลา ")[1] || "",
        openingDaysEn: translateDays(data.openingHours?.split(" เวลา ")[0] || ""),
        openingTimeEn: translateTime(data.openingHours?.split(" เวลา ")[1] || ""),
        submissionLocationEn: (data as any).submissionLocationEn || "",
      };
      setInitialData(extendedData);
      setFormData(extendedData);
    } catch (err) {
      console.error("Failed to refresh address data:", err);
      setErrorMessage("ไม่สามารถโหลดข้อมูลที่อยู่ของระบบได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsRefreshing(false);
    }
  };

  const isDirty = useMemo(() => {
    if (!initialData || !formData) return false;
    return JSON.stringify(initialData) !== JSON.stringify(formData);
  }, [initialData, formData]);

  const handleFieldChange = (field: keyof ExtendedSystemAddressData, value: string) => {
    if (!formData) return;

    let newFormData = { ...formData, [field]: value };

    if (field === "openingDaysTh") {
      newFormData.openingDaysEn = translateDays(value);
    }
    if (field === "openingTimeTh") {
      newFormData.openingTimeEn = translateTime(value);
    }

    setFormData(newFormData);
  };

  const handleReset = () => {
    if (initialData) {
      setFormData(JSON.parse(JSON.stringify(initialData)));
      showToast("คืนค่าข้อมูลเดิมเรียบร้อยแล้ว");
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData) return;

    if (!formData.facultyNameTh.trim()) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setIsSaving(true);
    try {
      // นำวัน/เวลากลับไปรวมใน openingHours เพื่อให้ saveSystemAddress ทำงานได้ตามโครงสร้างเก่า
      const combinedOpeningHours = `${formData.openingDaysTh} เวลา ${formData.openingTimeTh}`;

      const payload: SystemAddressData = {
        ...formData,
        openingHours: combinedOpeningHours,
      };

      const saved = await saveSystemAddress(payload);

      const savedExtended: ExtendedSystemAddressData = {
        ...saved,
        openingDaysTh: formData.openingDaysTh,
        openingDaysEn: formData.openingDaysEn,
        openingTimeTh: formData.openingTimeTh,
        openingTimeEn: formData.openingTimeEn,
        submissionLocationEn: formData.submissionLocationEn,
      };

      setInitialData(savedExtended);
      setFormData(savedExtended);
      showToast("บันทึกข้อมูลเรียบร้อยแล้ว");
    } catch (err) {
      console.error("Failed to save address:", err);
      showToast("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

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
        </div>
      ) : errorMessage || !formData ? (
        <div className="bg-white rounded-2xl border border-red-200 p-10 text-center shadow-sm">
          <AlertCircle size={36} className="text-red-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900">
            {errorMessage || "เกิดข้อผิดพลาดในการโหลดข้อมูล"}
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">ไม่สามารถแสดงข้อมูลที่อยู่ระบบได้</p>
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
              กล่องข้อมูลหลัก (รวมทุกอย่างไว้ในกล่องเดียว)
          =================================================== */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 pb-4 mb-4 border-b border-gray-100 flex items-center gap-2">
              <Building size={19} className="text-[#ea580c]" />
              ข้อมูลและการติดต่อ
            </h3>

            <div className="space-y-6">
              {/* ส่วนที่ 1: ข้อมูลคณะ และ จุดติดต่อ */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    ข้อมูลคณะและหน่วยงานสังกัด <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.facultyNameTh}
                    onChange={(e) => handleFieldChange("facultyNameTh", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                    placeholder="เช่น คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      จุดติดต่อเจ้าหน้าที่ (ภาษาไทย)
                    </label>
                    <input
                      type="text"
                      value={formData.submissionLocation}
                      onChange={(e) => handleFieldChange("submissionLocation", e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      placeholder="เช่น ห้องธุรการ ชั้น 1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Contact Location (English)
                    </label>
                    <input
                      type="text"
                      value={formData.submissionLocationEn || ""}
                      onChange={(e) => handleFieldChange("submissionLocationEn", e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      placeholder="e.g. Admin Office, 1st Floor"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 my-4"></div>

              {/* ส่วนที่ 2: ข้อมูลการติดต่อ */}
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
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    เบอร์ต่อภายใน (Ext.)
                  </label>
                  <input
                    type="text"
                    value={formData.internalExt || ""}
                    onChange={(e) => handleFieldChange("internalExt", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น 5025"
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
                    placeholder="เช่น email@cmu.ac.th"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 my-4"></div>

              {/* ส่วนที่ 3: วันและเวลาทำการ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    วันทำการ (ภาษาไทย) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.openingDaysTh || ""}
                    onChange={(e) => handleFieldChange("openingDaysTh", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น วันจันทร์ - วันศุกร์"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Working Days (Auto Map)
                  </label>
                  <input
                    type="text"
                    value={formData.openingDaysEn || ""}
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
                    value={formData.openingTimeTh || ""}
                    onChange={(e) => handleFieldChange("openingTimeTh", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น 08:30 - 16:30 น."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Working Hours (Auto Map)
                  </label>
                  <input
                    type="text"
                    value={formData.openingTimeEn || ""}
                    onChange={(e) => handleFieldChange("openingTimeEn", e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="e.g. 08:30 - 16:30"
                  />
                </div>
              </div>

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
              Live Preview: Student Contact Card
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

            <div className="bg-gradient-to-br from-orange-500/5 via-amber-500/5 to-orange-500/10 rounded-xl p-5 border border-orange-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-[#ea580c]" />
                  ติดต่อเจ้าหน้าที่กองทุน
                </h4>
                <span className="text-[11px] font-medium text-orange-600 bg-orange-100/70 px-2 py-0.5 rounded-md">
                  {formData.facultyNameTh || "ชื่อหน่วยงาน"}
                </span>
              </div>

              <div className="space-y-3 text-xs text-gray-700">
                <div className="flex items-start gap-2.5">
                  <Phone size={15} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-gray-900">{formData.phone || "-"}</span>
                    {formData.internalExt && (
                      <span className="text-gray-500 ml-1.5">(ต่อ {formData.internalExt})</span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Mail size={15} className="text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-gray-800 break-all">{formData.email || "-"}</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin size={15} className="text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-gray-800 leading-relaxed">
                    {formData.submissionLocation || "-"}
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock size={15} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-gray-800">
                      {formData.openingDaysTh || "-"} เวลา {formData.openingTimeTh || "-"}
                    </span>
                    {formData.closedDaysNote && (
                      <div className="text-[11px] text-gray-500 mt-1">
                        {formData.closedDaysNote}
                      </div>
                    )}
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
                  onClick={handleReset}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  คืนค่าเดิม
                </button>
              )}
              <button
                onClick={() => handleSave()}
                disabled={isSaving}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 text-sm font-bold text-white bg-[#ea580c] hover:bg-[#c2410c] rounded-lg shadow-sm transition-all"
              >
                {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
