// src/components/superadmin/setting/SystemBudgetTab.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Wallet, Save, Plus, Minus } from "lucide-react";
import {
  computeFundBudgetTotals,
  computeUsagePercentage,
  mapFundTransactionError,
  resolveFundAdjustment,
  type FundBudgetOverview,
} from "@/lib/fund-budget";

const formatCurrency = (amount: number) => new Intl.NumberFormat("th-TH").format(amount);

export default function SystemBudgetTab() {
  const [overview, setOverview] = useState<FundBudgetOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [budgetAmount, setBudgetAmount] = useState<number | "">("");
  const [budgetReason, setBudgetReason] = useState("");

  // Tracks whichever fetch is in flight (mount-time or the post-save reload from handleSave)
  // so it can be aborted on unmount either way, instead of only the mount-time one.
  const activeControllerRef = useRef<AbortController | null>(null);

  const loadOverview = () => {
    activeControllerRef.current?.abort();
    const controller = new AbortController();
    activeControllerRef.current = controller;
    fetch("/api/super-admin/fund-transactions", { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(body?.error?.message || body?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
        }
        return body.data as FundBudgetOverview;
      })
      .then((data) => {
        setOverview(data);
        setBudgetAmount(computeFundBudgetTotals(data).currentTotal);
        setErrorMessage(null);
      })
      .catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error("Failed to load fund overview", err);
          setErrorMessage("ไม่สามารถโหลดข้อมูลวงเงินได้ กรุณาตรวจสอบการเชื่อมต่อ API");
        }
      })
      .finally(() => setIsLoading(false));
    return controller;
  };

  useEffect(() => {
    loadOverview();
    return () => activeControllerRef.current?.abort();
  }, []);

  const { spentAmount, pendingAmount, remainingBudget, currentTotal } = overview
    ? computeFundBudgetTotals(overview)
    : { spentAmount: 0, pendingAmount: 0, remainingBudget: 0, currentTotal: 0 };

  const handleDecrease = () => {
    setBudgetAmount((prev) => {
      const current = Number(prev) || 0;
      return Math.max(0, current - 1000);
    });
  };

  const handleIncrease = () => {
    setBudgetAmount((prev) => {
      const current = Number(prev) || 0;
      return current + 1000;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      setBudgetAmount("");
    } else {
      setBudgetAmount(Math.max(0, Number(val)));
    }
  };

  const handleReset = () => {
    setBudgetAmount(currentTotal);
    setBudgetReason("");
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    const target = Number(budgetAmount) || 0;
    const adjustment = resolveFundAdjustment(target, currentTotal);

    if (!adjustment) return;
    if (!budgetReason.trim()) {
      setErrorMessage("กรุณาระบุเหตุผลการปรับวงเงิน");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/super-admin/fund-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: adjustment.kind,
          amount: adjustment.amount,
          note: budgetReason.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          mapFundTransactionError(res.status, data?.error?.code, data?.error?.message),
        );
      }

      setBudgetReason("");
      setSuccessMessage("บันทึกวงเงินสำเร็จ");
      loadOverview();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  const usagePercentage = computeUsagePercentage({ spentAmount, pendingAmount, currentTotal });

  if (isLoading && !overview) {
    return (
      <div className="animate-in fade-in duration-300 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">กำลังโหลดข้อมูลวงเงิน...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
      {/* ========================================== */}
      {/* ส่วนฟอร์มปรับวงเงิน (ซ้าย) */}
      {/* ========================================== */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Wallet size={20} className="text-[#ea580c]" />
          ปรับวงเงินรวมของระบบ
        </h2>

        <div className="space-y-6">
          {/* Input: วงเงินรวม (- / +) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">วงเงินรวม</label>
            <div className="flex items-center">
              <button
                onClick={handleDecrease}
                className="w-12 h-12 flex items-center justify-center bg-gray-50 border border-gray-300 rounded-l-lg hover:bg-orange-50 hover:text-[#ea580c] hover:border-orange-300 text-gray-600 transition-colors"
                title="ลด 1,000"
                disabled={isSubmitting}
              >
                <Minus size={20} />
              </button>
              <input
                type="number"
                min="0"
                step="1000"
                value={budgetAmount}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full h-12 px-4 bg-white border-y border-gray-300 text-center text-lg font-bold text-[#ea580c] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all z-10 disabled:bg-gray-100"
                placeholder="0"
              />
              <button
                onClick={handleIncrease}
                className="w-12 h-12 flex items-center justify-center bg-gray-50 border border-gray-300 rounded-r-lg hover:bg-orange-50 hover:text-[#ea580c] hover:border-orange-300 text-gray-600 transition-colors"
                title="เพิ่ม 1,000"
                disabled={isSubmitting}
              >
                <Plus size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              ยอดวงเงินรวม:{" "}
              <span className="font-bold text-gray-800">{formatCurrency(Number(budgetAmount) || 0)}</span>
            </p>
          </div>

          {/* Input: เหตุผลการปรับ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">เหตุผลการปรับ</label>
            <input
              type="text"
              placeholder="เช่น ได้รับงบเพิ่มจากมหาวิทยาลัยประจำปี 2569"
              value={budgetReason}
              onChange={(e) => setBudgetReason(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all disabled:bg-gray-100"
            />
          </div>

          {errorMessage && (
            <div className="text-[13px] text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="text-[13px] text-green-700 bg-green-50 p-2.5 rounded-lg border border-green-200">
              {successMessage}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={isSubmitting || Number(budgetAmount) === currentTotal}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded-lg transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {isSubmitting ? "กำลังบันทึก..." : "บันทึกวงเงิน"}
            </button>
            <button
              onClick={handleReset}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-bold rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              รีเซ็ต
            </button>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* ส่วนสรุปการใช้วงเงิน (ขวา) */}
      {/* ========================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-fit">
        <h2 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">สรุปการใช้วงเงิน</h2>

        <div className="space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <span className="text-[13px] text-gray-600">วงเงินที่ปรับปรุง</span>
            <span className="text-[15px] font-bold text-gray-900">{formatCurrency(currentTotal)}</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <span className="text-[13px] text-gray-600">เบิกจ่ายแล้ว</span>
            <span className="text-[14px] font-bold text-green-600">{formatCurrency(spentAmount)}</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <span className="text-[13px] text-gray-600">รออนุมัติ / ตรวจสอบ</span>
            <span className="text-[14px] font-bold text-amber-500">{formatCurrency(pendingAmount)}</span>
          </div>
          <div className="flex justify-between items-center pb-4">
            <span className="text-[14px] font-bold text-gray-900">คงเหลือใช้งานได้</span>
            <span
              className={`text-lg font-black ${remainingBudget < 0 ? "text-red-500" : "text-[#ea580c]"}`}
            >
              {formatCurrency(remainingBudget)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="pt-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] text-gray-500">อัตราการใช้ระบบ</span>
              <span className="text-[11px] font-bold text-gray-700">{usagePercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-orange-100/50 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#ea580c] h-2 rounded-full transition-all duration-500"
                style={{ width: `${usagePercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
