// src/components/superadmin/setting/SystemBudgetTab.tsx
"use client";

import React, { useState } from "react";
import { Wallet, Save, Plus, Minus } from "lucide-react";

export default function SystemBudgetTab() {
  // กำหนดวงเงินเริ่มต้น
  const [budgetAmount, setBudgetAmount] = useState<number | "">(5000000);
  const [budgetReason, setBudgetReason] = useState("");

  // ค่าใช้จ่ายจำลอง
  const spentAmount = 30000;
  const pendingAmount = 45000;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH").format(amount);
  };

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
      // ดักไม่ให้ค่าน้อยกว่า 0
      setBudgetAmount(Math.max(0, Number(val)));
    }
  };

  const currentTotal = Number(budgetAmount) || 0;
  const remainingBudget = currentTotal - spentAmount - pendingAmount;
  
  // คำนวณเปอร์เซ็นต์การใช้งาน (เพื่อแสดงผล Progress Bar)
  const usagePercentage = currentTotal > 0 
    ? Math.min(100, ((spentAmount + pendingAmount) / currentTotal) * 100) 
    : 0;

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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วงเงินรวม
            </label>
            <div className="flex items-center">
              <button
                onClick={handleDecrease}
                className="w-12 h-12 flex items-center justify-center bg-gray-50 border border-gray-300 rounded-l-lg hover:bg-orange-50 hover:text-[#ea580c] hover:border-orange-300 text-gray-600 transition-colors"
                title="ลด 1,000"
              >
                <Minus size={20} />
              </button>
              <input
                type="number"
                min="0"
                step="1000"
                value={budgetAmount}
                onChange={handleInputChange}
                className="w-full h-12 px-4 bg-white border-y border-gray-300 text-center text-lg font-bold text-[#ea580c] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all z-10"
                placeholder="0"
              />
              <button
                onClick={handleIncrease}
                className="w-12 h-12 flex items-center justify-center bg-gray-50 border border-gray-300 rounded-r-lg hover:bg-orange-50 hover:text-[#ea580c] hover:border-orange-300 text-gray-600 transition-colors"
                title="เพิ่ม 1,000"
              >
                <Plus size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              ยอดวงเงินรวม: <span className="font-bold text-gray-800">฿{formatCurrency(currentTotal)}</span>
            </p>
          </div>

          {/* Input: เหตุผลการปรับ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เหตุผลการปรับ
            </label>
            <input
              type="text"
              placeholder="เช่น ได้รับงบเพิ่มจากมหาวิทยาลัยประจำปี 2569"
              value={budgetReason}
              onChange={(e) => setBudgetReason(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded-lg transition-colors shadow-sm text-sm">
              <Save size={18} />
              บันทึกวงเงิน
            </button>
            <button
              onClick={() => {
                setBudgetAmount(5000000);
                setBudgetReason("");
              }}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-bold rounded-lg transition-colors text-sm"
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
        <h2 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
          สรุปการใช้วงเงิน
        </h2>

        <div className="space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <span className="text-[13px] text-gray-600">วงเงินที่ปรับปรุง</span>
            <span className="text-[15px] font-bold text-gray-900">
              ฿{formatCurrency(currentTotal)}
            </span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <span className="text-[13px] text-gray-600">เบิกจ่ายแล้ว</span>
            <span className="text-[14px] font-bold text-green-600">
              ฿{formatCurrency(spentAmount)}
            </span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <span className="text-[13px] text-gray-600">รออนุมัติ / ตรวจสอบ</span>
            <span className="text-[14px] font-bold text-amber-500">
              ฿{formatCurrency(pendingAmount)}
            </span>
          </div>
          <div className="flex justify-between items-center pb-4">
            <span className="text-[14px] font-bold text-gray-900">คงเหลือใช้งานได้</span>
            <span className={`text-lg font-black ${remainingBudget < 0 ? "text-red-500" : "text-[#ea580c]"}`}>
              ฿{formatCurrency(remainingBudget)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="pt-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] text-gray-500">อัตราการใช้ระบบ</span>
              <span className="text-[11px] font-bold text-gray-700">
                {usagePercentage.toFixed(1)}%
              </span>
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