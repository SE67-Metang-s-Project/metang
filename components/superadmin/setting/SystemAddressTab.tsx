// src/components/superadmin/setting/SystemAddressTab.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  MapPin,
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
} from "lucide-react";
import {
  type SystemAddressData,
  getSystemAddress,
  saveSystemAddress,
} from "@/components/shared/mock-data/mockSystemSettings";

export default function SystemAddressTab() {
  const [initialData, setInitialData] = useState<SystemAddressData | null>(null);
  const [formData, setFormData] = useState<SystemAddressData | null>(null);
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

  // 1. Data Retrieval: Initial Mount Effect
  useEffect(() => {
    let isMounted = true;

    getSystemAddress()
      .then((data) => {
        if (isMounted) {
          setInitialData(data);
          setFormData(data);
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

  // ฟังก์ชันรีเฟรชข้อมูลแบบ manual
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setErrorMessage(null);
      const data = await getSystemAddress();
      setInitialData(data);
      setFormData(data);
    } catch (err) {
      console.error("Failed to refresh address data:", err);
      setErrorMessage("ไม่สามารถโหลดข้อมูลที่อยู่ของระบบได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsRefreshing(false);
    }
  };

  // ตรวจสอบว่าฟอร์มมีการแก้ไขหรือไม่ (isDirty)
  const isDirty = useMemo(() => {
    if (!initialData || !formData) return false;
    return JSON.stringify(initialData) !== JSON.stringify(formData);
  }, [initialData, formData]);

  // จัดการการพิมพ์ในฟอร์ม
  const handleFieldChange = (field: keyof SystemAddressData, value: string) => {
    if (!formData) return;
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  // รีเซ็ตข้อมูลกลับเป็นค่าที่โหลดมา
  const handleReset = () => {
    if (initialData) {
      setFormData(JSON.parse(JSON.stringify(initialData)));
      showToast("คืนค่าข้อมูลเดิมเรียบร้อยแล้ว");
    }
  };

  // บันทึกข้อมูล
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData) return;

    // ตรวจสอบข้อมูลจำเป็น
    if (!formData.facultyNameTh.trim() || !formData.streetAddress.trim()) {
      alert("กรุณากรอกชื่อหน่วยงานและที่อยู่ให้ครบถ้วน");
      return;
    }

    setIsSaving(true);
    try {
      // สร้างที่อยู่บรรทัดเดียวสำหรับใช้ในหัวสัญญาอัตโนมัติ
      const autoFormattedAddress = `${formData.facultyNameTh} ${
        formData.building ? formData.building + " " : ""
      }${formData.streetAddress} ${formData.subDistrict} ${formData.district} ${formData.province} ${
        formData.postalCode
      }`;

      const payload: SystemAddressData = {
        ...formData,
        contractHeaderFormat: autoFormattedAddress,
      };

      const saved = await saveSystemAddress(payload);
      setInitialData(saved);
      setFormData(saved);
      showToast("บันทึกข้อมูลที่อยู่และช่องทางติดต่อเรียบร้อยแล้ว");
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
      {/* =====================================================
          2. Loading / Error States
      ===================================================== */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-100 rounded"></div>
            <div className="h-10 bg-gray-100 rounded"></div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-10 bg-gray-100 rounded"></div>
              <div className="h-10 bg-gray-100 rounded"></div>
            </div>
          </div>
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
        /* =====================================================
            3. Main Stack Layout (Full Width)
        ===================================================== */
        <div className="space-y-6">
          {/* ===================================================
              3.1 ข้อมูลหน่วยงานและสังกัด
          =================================================== */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 pb-4 mb-4 border-b border-gray-100 flex items-center gap-2">
              <Building size={19} className="text-[#ea580c]" />
              ข้อมูลคณะและหน่วยงานสังกัด
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  ชื่อหน่วยงาน / คณะ (ภาษาไทย) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.facultyNameTh}
                  onChange={(e) => handleFieldChange("facultyNameTh", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                  placeholder="เช่น คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Faculty / Organization Name (English)
                </label>
                <input
                  type="text"
                  value={formData.facultyNameEn}
                  onChange={(e) => handleFieldChange("facultyNameEn", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-700"
                  placeholder="e.g. Faculty of Nursing, Chiang Mai University"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    ฝ่าย / หน่วยงานย่อย (ภาษาไทย)
                  </label>
                  <input
                    type="text"
                    value={formData.departmentTh}
                    onChange={(e) => handleFieldChange("departmentTh", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น หน่วยพัฒนาคุณภาพนักศึกษาและศิษย์เก่าสัมพันธ์"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    เลขประจำตัวผู้เสียภาษี (Tax ID)
                  </label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => handleFieldChange("taxId", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น 0994000164901"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================
              3.2 สถานที่ตั้งและที่อยู่ทางการ
          =================================================== */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 pb-4 mb-4 border-b border-gray-100 flex items-center gap-2">
              <MapPin size={19} className="text-[#ea580c]" />
              สถานที่ตั้งและที่อยู่ทางการ
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    อาคาร / ชั้น / ห้อง
                  </label>
                  <input
                    type="text"
                    value={formData.building}
                    onChange={(e) => handleFieldChange("building", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น อาคาร 1 (อาคารเทพรัตน์) ชั้น 1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    เลขที่ตั้งและถนน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.streetAddress}
                    onChange={(e) => handleFieldChange("streetAddress", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น 110 ถนนอินทวโรรส"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    ตำบล / แขวง
                  </label>
                  <input
                    type="text"
                    value={formData.subDistrict}
                    onChange={(e) => handleFieldChange("subDistrict", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น ตำบลศรีภูมิ"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    อำเภอ / เขต
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => handleFieldChange("district", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น อำเภอเมืองเชียงใหม่"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">จังหวัด</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => handleFieldChange("province", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น จังหวัดเชียงใหม่"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    รหัสไปรษณีย์
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleFieldChange("postalCode", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น 50200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    จุดส่งสัญญากู้ยืมและเอกสารคำร้อง (สำหรับนักศึกษา)
                  </label>
                  <input
                    type="text"
                    value={formData.submissionLocation}
                    onChange={(e) => handleFieldChange("submissionLocation", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น ชั้น 1 อาคารเทพรัตน์ คณะพยาบาลศาสตร์ มช."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================
              3.3 ช่องทางการติดต่อและเวลาทำการ
          =================================================== */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 pb-4 mb-4 border-b border-gray-100 flex items-center gap-2">
              <Phone size={19} className="text-[#ea580c]" />
              ช่องทางการติดต่อและเวลาทำการ
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    เบอร์โทรศัพท์หลัก <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
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
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น 5025, 5026"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    โทรสาร (Fax)
                  </label>
                  <input
                    type="text"
                    value={formData.fax || ""}
                    onChange={(e) => handleFieldChange("fax", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น 053-217145"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    อีเมลติดต่อทางการ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น loan@nurse.cmu.ac.th"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Line Official / Social
                  </label>
                  <input
                    type="text"
                    value={formData.lineOfficial || ""}
                    onChange={(e) => handleFieldChange("lineOfficial", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น @nurse_cmu_loan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    เวลาทำการ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.openingHours}
                    onChange={(e) => handleFieldChange("openingHours", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น วันจันทร์ - วันศุกร์ เวลา 08:30 - 16:30 น."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    หมายเหตุวันหยุด
                  </label>
                  <input
                    type="text"
                    value={formData.closedDaysNote}
                    onChange={(e) => handleFieldChange("closedDaysNote", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="เช่น เว้นวันหยุดราชการและวันหยุดนักขัตฤกษ์"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  เว็บไซต์ทางการคณะ
                </label>
                <input
                  type="url"
                  value={formData.officialWebsite || ""}
                  onChange={(e) => handleFieldChange("officialWebsite", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  placeholder="https://www.nurse.cmu.ac.th"
                />
              </div>
            </div>
          </div>

          {/* ===================================================
              3.4 Live Preview: Student Contact Card
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

            {/* Replica of Student LoanContactCard */}
            <div className="bg-gradient-to-br from-orange-500/5 via-amber-500/5 to-orange-500/10 rounded-xl p-5 border border-orange-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-[#ea580c]" />
                  ติดต่อเจ้าหน้าที่กองทุน
                </h4>
                <span className="text-[11px] font-medium text-orange-600 bg-orange-100/70 px-2 py-0.5 rounded-md">
                  งานกิจการนักศึกษา
                </span>
              </div>

              <div className="space-y-3 text-xs text-gray-700">
                <div className="flex items-start gap-2.5">
                  <Phone size={15} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-gray-900">{formData.phone}</span>
                    {formData.internalExt && (
                      <span className="text-gray-500 ml-1.5">(ต่อ {formData.internalExt})</span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Mail size={15} className="text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-gray-800 break-all">{formData.email}</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin size={15} className="text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-gray-800 leading-relaxed">
                    {formData.submissionLocation}
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock size={15} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-gray-800">{formData.openingHours}</span>
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
              Bottom Actions Bar (ย้ายปุ่ม Refresh ลงมา)
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
              {/* ปุ่มรีเฟรชข้อมูล */}
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
