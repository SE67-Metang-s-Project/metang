"use client";

import { useState } from "react";
import PendingRequestsList from "@/components/advisor/dashboard/RequestsList";
import ExecutiveFinancialOverview from "./ExecutiveFinancialOverview";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";
import WelcomeCard from "@/components/shared/WelcomeCard";

export default function ExecutiveDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-[family-name:var(--font-kanit)] text-gray-800">
      <SideNav
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        role="executive"
      />

      <main className="flex-1 flex flex-col w-full min-h-screen lg:ml-64 transition-all duration-300">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="ผศ.ดร. สุนีย์ วงค์ประเสริฐ"
          userId="T1002"
        />

        <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] w-full mx-auto space-y-8">
          <div className="w-full">
            <WelcomeCard name="ออมซ่า วงค์ประเสริฐ" description="ผู้บริหาร" />
          </div>

          <div className="w-full font-[family-name:var(--font-kanit)]">
            <ExecutiveFinancialOverview />
          </div>

          <div className="w-full font-[family-name:var(--font-kanit)]">
            <h2 className="text-xl font-semibold text-slate-800 sm:text-2xl">พิจารณาคำร้อง</h2>
            <p className="mt-1 text-sm text-slate-500">ภาพรวมข้อมูลทางการเงินในระบบ</p>
          </div>

          <div className="w-full font-[family-name:var(--font-kanit)]">
            <PendingRequestsList />
          </div>
        </div>
      </main>
    </div>
  );
}
