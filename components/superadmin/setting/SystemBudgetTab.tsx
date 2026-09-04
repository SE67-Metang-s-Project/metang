// src/components/superadmin/setting/SystemBudgetTab.tsx
"use client";

import React, { useState } from "react";
import { Wallet, Save } from "lucide-react";

export default function SystemBudgetTab() {
  const [budgetAmount, setBudgetAmount] = useState<number>(5000000);
  const [budgetReason, setBudgetReason] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH').format(amount);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
      {/* Left Column: Form Adjust Budget */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Wallet size={20} className="text-blue-600" />
          ปรับวงเงินรวมของระบบ
        </h2>

        <div className="space-y-6">
          {/* Budget Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">วงเงินรวม (บาท)</label>
            <div className="relative">
              <input
                type="number"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-base font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col">
                <button className="text-gray-400 hover:text-gray-600" onClick={() => setBudgetAmount(b => b + 100000)}>▲</button>
                <button className="text-gray-400 hover:text-gray-600" onClick={() => setBudgetAmount(b => b - 100000)}>▼</button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              = ฿{formatCurrency(budgetAmount)}
            </p>
          </div>

          {/* Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">ปรับด้วยแถบเลื่อน (0 – 20,000,000 ฿)</label>
              <span className="text-xs text-gray-500">ขั้นละ: 100,000 ฿</span>
            </div>
            <input
              type="range"
              min="0"
              max="20000000"
              step="100000"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(Number(e.target.value))}
              className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">เหตุผลการปรับ (บันทึกลง Audit Log)</label>
            <input
              type="text"
              placeholder="เช่น ได้รับงบเพิ่มจากมหาวิทยาลัย"
              value={budgetReason}
              onChange={(e) => setBudgetReason(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors shadow-sm text-sm">
              <Save size={18} />
              บันทึกวงเงิน
            </button>
            <button
              onClick={() => {
                setBudgetAmount(5000000);
                setBudgetReason("");
              }}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold rounded-lg transition-colors text-sm"
            >
              รีเซ็ต
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Summary Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-fit">
        <h2 className="text-base font-bold text-gray-900 mb-6">สรุปการใช้วงเงิน</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <span className="text-sm text-gray-600">วงเงินปัจจุบัน</span>
            <span className="text-base font-bold text-gray-900">฿{formatCurrency(budgetAmount)}</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <span className="text-sm text-gray-600">เบิกจ่ายแล้ว</span>
            <span className="text-base font-bold text-emerald-600">฿30,000</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-gray-100">
            <span className="text-sm text-gray-600">รออนุมัติ/ตรวจสอบ</span>
            <span className="text-base font-bold text-orange-500">฿45,000</span>
          </div>
          <div className="flex justify-between items-center pb-4">
            <span className="text-sm font-bold text-gray-900">คงเหลือ</span>
            <span className="text-lg font-black text-blue-600">฿{formatCurrency(budgetAmount - 75000)}</span>
          </div>

          {/* Progress Bar */}
          <div className="pt-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">อัตราการใช้</span>
              <span className="text-xs font-bold text-gray-700">1%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '1%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}