// app/superadmin/setting/page.tsx
"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";
import { Users, Wallet, Landmark, MapPin } from "lucide-react"; // เพิ่ม Landmark และ MapPin

import type { SuperAdminUser } from "@/lib/loan-api-types";

// Import Components ที่เราแยกไว้
import UserRolesTab from "@/components/superadmin/setting/UserRolesTab";
import SystemBudgetTab from "@/components/superadmin/setting/SystemBudgetTab";
import SystemBankTab from "@/components/superadmin/setting/SystemBankTab"; // <--- นำเข้าไฟล์ใหม่
import SystemAddressTab from "@/components/superadmin/setting/SystemAddressTab"; // <--- นำเข้าไฟล์ใหม่

interface SettingsPageProps {
  userName?: string;
  userId?: string;
  userEmail?: string;
  currentUserId?: string;
  initialUsers?: SuperAdminUser[];
}

export default function SettingsPage({
  userName = "SuperAdmin",
  userId = "SA-001",
  userEmail,
  currentUserId,
  initialUsers = [],
}: SettingsPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // เพิ่ม State สำหรับ bank และ address
  const [activeTab, setActiveTab] = useState<"users" | "budget" | "bank" | "address">("users");

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="superadmin" />

      <div className="flex-1 flex flex-col w-full min-h-screen min-[1576px]:ml-64 transition-all duration-300">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName={userName}
          userId={userId}
          userEmail={userEmail}
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#0f172a] mb-1">ศูนย์ควบคุมระบบ</h1>
            <p className="text-sm text-gray-500">
              SuperAdmin · จัดการผู้ใช้ บทบาท วงเงิน บัญชี และที่อยู่
            </p>
          </div>

          {/* Tabs Toggle (ปรับให้เลื่อนซ้ายขวาได้ในจอมือถือ) */}
          <div className="overflow-x-auto pb-2 mb-4 scrollbar-hide">
            <div className="inline-flex bg-slate-100/80 p-1 rounded-xl shadow-sm border border-slate-200/50 whitespace-nowrap">
              <button
                onClick={() => setActiveTab("users")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "users"
                    ? "bg-white text-[#ea580c] shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <Users
                  size={18}
                  className={activeTab === "users" ? "text-slate-700" : "text-slate-500"}
                />
                ผู้ใช้และบทบาท
              </button>

              <button
                onClick={() => setActiveTab("budget")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "budget"
                    ? "bg-white text-[#ea580c] shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <Wallet
                  size={18}
                  className={activeTab === "budget" ? "text-slate-700" : "text-slate-500"}
                />
                วงเงินระบบ
              </button>

              <button
                onClick={() => setActiveTab("bank")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "bank"
                    ? "bg-white text-[#ea580c] shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <Landmark
                  size={18}
                  className={activeTab === "bank" ? "text-slate-700" : "text-slate-500"}
                />
                บัญชีธนาคาร
              </button>

              <button
                onClick={() => setActiveTab("address")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "address"
                    ? "bg-white text-[#ea580c] shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <MapPin
                  size={18}
                  className={activeTab === "address" ? "text-slate-700" : "text-slate-500"}
                />
                จัดการที่อยู่
              </button>
            </div>
          </div>

          {/* Render Tab Content */}
          {activeTab === "users" && (
            <UserRolesTab initialUsers={initialUsers} currentUserId={currentUserId} />
          )}
          {activeTab === "budget" && <SystemBudgetTab />}
          {activeTab === "bank" && <SystemBankTab />}
          {activeTab === "address" && <SystemAddressTab />}
        </main>
      </div>
    </div>
  );
}
