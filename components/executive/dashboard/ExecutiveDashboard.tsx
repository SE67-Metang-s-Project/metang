"use client";

import React from "react";
import ExecutiveFinancialOverview from "@/components/shared/financial/FinancialOverview";
import WelcomeCard from "@/components/shared/WelcomeCard";

import type { ExecutiveFinancialOverviewData } from "@/lib/financial-overview-types";

type ExecutiveDashboardProps = {
  userName?: string;
  userId?: string;
  financialOverview?: ExecutiveFinancialOverviewData;
};

export default function ExecutiveDashboard({
  userName = "ผู้บริหาร",
  financialOverview,
}: ExecutiveDashboardProps) {
  return (
    <div className="space-y-8 font-[family-name:var(--font-kanit)]">
      <div className="w-full">
        <WelcomeCard name={userName} description="ผู้บริหาร" />
      </div>

      <div className="w-full">
        <ExecutiveFinancialOverview initialData={financialOverview} />
      </div>
    </div>
  );
}

