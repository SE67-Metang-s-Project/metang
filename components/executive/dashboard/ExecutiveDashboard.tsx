"use client";

import { useState } from "react";
import ExecutiveFinancialOverview from "@/components/shared/financial/FinancialOverview";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";
import WelcomeCard from "@/components/shared/WelcomeCard";

import type { ExecutiveFinancialOverviewData } from "@/lib/financial-overview-types";

type ExecutiveDashboardProps = {
  userName?: string;
  userId?: string;
  financialOverview?: ExecutiveFinancialOverviewData;
};

export default function ExecutiveDashboard({
  userName = "ผู้บริหาร",
  userId = "Executive",
  financialOverview,
}: ExecutiveDashboardProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-[family-name:var(--font-kanit)] text-gray-800">
      <SideNav
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        role="executive"
      />

      <main className="flex-1 flex flex-col w-full min-h-screen min-[1576px]:ml-64 transition-all duration-300">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName={userName}
          userId={userId}
        />

        <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] w-full mx-auto space-y-8">
          <div className="w-full">
            <WelcomeCard name={userName} description="ผู้บริหาร" />
          </div>

          <div className="w-full font-[family-name:var(--font-kanit)]">
            <ExecutiveFinancialOverview initialData={financialOverview} />
          </div>
        </div>
      </main>
    </div>
  );
}
