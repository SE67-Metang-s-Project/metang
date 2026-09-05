// src/components/superadmin/setting/SystemBankTab.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Landmark, Save, CheckCircle2, RefreshCw, X, AlertCircle } from "lucide-react";
import {
  type SystemBankAccount,
  getSystemBankAccounts,
  saveSystemBankAccounts,
} from "@/components/shared/mock-data/mockSystemSettings";

// รายชื่อธนาคารและธีมสี
const bankPresets: Record<string, { name: string; code: SystemBankAccount["bankCode"] }> = {
  KTB: { name: "ธนาคารกรุงไทย", code: "KTB" },
  SCB: { name: "ธนาคารไทยพาณิชย์", code: "SCB" },
  KBANK: { name: "ธนาคารกสิกรไทย", code: "KBANK" },
  BBL: { name: "ธนาคารกรุงเทพ", code: "BBL" },
  GSB: { name: "ธนาคารออมสิน", code: "GSB" },
  BAY: { name: "ธนาคารกรุงศรีอยุธยา", code: "BAY" },
  TTB: { name: "ธนาคารทหารไทยธนชาต", code: "TTB" },
  OTHER: { name: "ธนาคารอื่นๆ", code: "OTHER" },
};

export default function SystemBankTab() {
  const [allAccounts, setAllAccounts] = useState<SystemBankAccount[]>([]);
  const [formData, setFormData] = useState<SystemBankAccount | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // โหลดข้อมูลเมื่อเปิดหน้า
  useEffect(() => {
    let isMounted = true;
    getSystemBankAccounts()
      .then((data) => {
        if (isMounted) {
          setAllAccounts(data);
          // ดึงบัญชีหลักมาแสดงในฟอร์ม (หรือถ้าไม่มีให้ดึงบัญชีแรก)
          const primaryAcc = data.find((a) => a.isPrimary) || data[0];
          setFormData(primaryAcc || null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch bank accounts:", err);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // บันทึกฟอร์ม
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    // Validation
    const errors: Record<string, string> = {};
    if (!formData.bankName.trim()) errors.bankName = "กรุณาระบุชื่อธนาคาร";
    if (!formData.accountNumber.trim()) {
      errors.accountNumber = "กรุณาระบุเลขที่บัญชี";
    } else if (!/^[0-9-]+$/.test(formData.accountNumber)) {
      errors.accountNumber = "เลขที่บัญชีต้องประกอบด้วยตัวเลขหรือเครื่องหมายขีด (-) เท่านั้น";
    }
    if (!formData.accountName.trim()) errors.accountName = "กรุณาระบุชื่อบัญชี";
    if (!formData.branch.trim()) errors.branch = "กรุณาระบุสาขา";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      // อัปเดตข้อมูลกลับเข้าไปใน Array เดิม
      const updatedList = allAccounts.map((acc) => {
        if (acc.id === formData.id) {
          return {
            ...acc,
            ...formData,
            updatedAt: "เมื่อสักครู่",
            updatedBy: "SuperAdmin",
          };
        }
        return acc;
      });

      setAllAccounts(updatedList);
      await saveSystemBankAccounts(updatedList);
      showToast("บันทึกข้อมูลบัญชีธนาคารเรียบร้อยแล้ว");
    } catch (err) {
      console.error("Failed to save bank account:", err);
      showToast("บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-pulse w-full">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          <div className="h-10 bg-gray-100 rounded"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-10 text-center shadow-sm w-full">
        <AlertCircle size={36} className="text-red-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-900">ไม่พบข้อมูลบัญชีธนาคาร</h3>
        <p className="text-sm text-gray-500 mt-1">กรุณาตรวจสอบฐานข้อมูลจำลองของระบบ</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
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

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl w-full p-6 sm:p-8 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between pb-5 mb-6 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Landmark size={22} className="text-[#ea580c]" />
              จัดการข้อมูลบัญชีรับชำระเงิน
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              บัญชีธนาคารหลักที่จะแสดงให้นักศึกษาเห็นเพื่อโอนเงินคืนกองทุน
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveForm} className="space-y-5">
          {/* Select Bank */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              ธนาคาร <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.bankCode}
              onChange={(e) => {
                const code = e.target.value as SystemBankAccount["bankCode"];
                const preset = bankPresets[code];
                setFormData({
                  ...formData,
                  bankCode: code,
                  bankName: preset ? preset.name : formData.bankName,
                });
              }}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              {Object.entries(bankPresets).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.name} ({key})
                </option>
              ))}
            </select>
          </div>

          {/* Custom Bank Name if OTHER */}
          {formData.bankCode === "OTHER" && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                ระบุชื่อธนาคาร <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="เช่น ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              {formErrors.bankName && (
                <p className="text-xs text-red-500 mt-1.5">{formErrors.bankName}</p>
              )}
            </div>
          )}

          {/* Account Number */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              เลขที่บัญชี <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น 521-0-12345-6"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
            {formErrors.accountNumber && (
              <p className="text-xs text-red-500 mt-1.5">{formErrors.accountNumber}</p>
            )}
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              ชื่อบัญชี <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่"
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
            {formErrors.accountName && (
              <p className="text-xs text-red-500 mt-1.5">{formErrors.accountName}</p>
            )}
          </div>

          {/* Grid: Account Type & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">ประเภทบัญชี</label>
              <select
                value={formData.accountType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    accountType: e.target.value as SystemBankAccount["accountType"],
                  })
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="ออมทรัพย์">ออมทรัพย์</option>
                <option value="กระแสรายวัน">กระแสรายวัน</option>
                <option value="ประจำ">ประจำ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                สาขา <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="เช่น สาขามหาวิทยาลัยเชียงใหม่"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              {formErrors.branch && (
                <p className="text-xs text-red-500 mt-1.5">{formErrors.branch}</p>
              )}
            </div>
          </div>

          {/* PromptPay ID */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              หมายเลขพร้อมเพย์ (เลขประจำตัวผู้เสียภาษี / เบอร์โทร)
            </label>
            <input
              type="text"
              placeholder="เช่น 0994000164901"
              value={formData.promptPayId || ""}
              onChange={(e) => setFormData({ ...formData, promptPayId: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              หมายเหตุ / วัตถุประสงค์
            </label>
            <textarea
              rows={3}
              placeholder="เช่น บัญชีหลักสำหรับรับเงินคืนจากนักศึกษาโครงการเงินยืมฉุกเฉิน"
              value={formData.note || ""}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 text-sm font-bold text-white bg-[#ea580c] hover:bg-[#c2410c] rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
              บันทึกข้อมูล
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
