"use client";

import { useState } from "react";
import ApprovalRequestsTable from "@/components/shared/ApprovalRequestsTable";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";
import { mockPendingRequests } from "@/lib/mock-data/pending-requests";

export default function ExecutiveApprovePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen font-[family-name:var(--font-kanit)] text-gray-800 bg-[#f8fafc]">
      <SideNav
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        role="executive"
      />

      <main className="flex flex-col flex-1 w-full min-h-screen transition-all duration-300 min-[1576px]:ml-64">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="ผศ.ดร. สุนีย์ วงค์ประเสริฐ"
          userId="T1002"
        />

        <div className="w-full max-w-[1600px] p-4 mx-auto space-y-8 sm:p-6 lg:p-8">
          <div>
            <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">พิจารณาคำร้อง</h1>
            <p className="mt-1 text-sm text-slate-500">ตรวจสอบและพิจารณาอนุมัติคำร้อง</p>
          </div>

          <div className="w-full">
            <ApprovalRequestsTable requests={mockPendingRequests} />
          </div>
        </div>
      </main>
    </div>
  );
}
