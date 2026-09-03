"use client";

import { useState } from "react";
import PendingRequestsList from "@/components/admin/pending/AdminRequestsList";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";

export default function ExecutivePendingPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-gray-800">
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="executive" />

      <main className="flex min-h-screen w-full flex-1 flex-col transition-all duration-300 lg:ml-64">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="ผศ.ดร. สุนีย์ วงค์ประเสริฐ"
          userId="T1002"
        />

        <div className="p-6">
          <PendingRequestsList userRole="executive" tableLayout="executive" />
        </div>
      </main>
    </div>
  );
}
