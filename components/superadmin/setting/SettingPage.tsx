// app/superadmin/setting/page.tsx
"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";
import { Users, Wallet } from "lucide-react";

// Import Components ที่เราแยกไว้
import UserRolesTab from "@/components/superadmin/setting/UserRolesTab";
import SystemBudgetTab from "@/components/superadmin/setting/SystemBudgetTab";

export default function SettingsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "budget">("users");

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="superadmin" />

      <div className="flex-1 flex flex-col w-full min-h-screen min-[1576px]:ml-64 transition-all duration-300">
        <TopNav onOpenSidebar={() => setIsSidebarOpen(true)} userName="SuperAdmin" userId="SA-001" />

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto w-full">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#0f172a] mb-1">ศูนย์ควบคุมระบบ</h1>
            <p className="text-sm text-gray-500">SuperAdmin · จัดการผู้ใช้ บทบาท วงเงิน</p>
          </div>

          {/* Tabs Toggle */}
          <div className="inline-flex bg-slate-100/80 p-1 rounded-xl mb-6 shadow-sm border border-slate-200/50">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "users"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <Users size={18} className={activeTab === "users" ? "text-slate-700" : "text-slate-500"} />
              ผู้ใช้และบทบาท
            </button>
            <button
              onClick={() => setActiveTab("budget")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "budget"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <Wallet size={18} className={activeTab === "budget" ? "text-slate-700" : "text-slate-500"} />
              วงเงินระบบ
            </button>
          </div>

          {/* Render Tab Content */}
          {activeTab === "users" && <UserRolesTab />}
          {activeTab === "budget" && <SystemBudgetTab />}

        </main>
      </div>
    </div>
  );
}
