"use client";

import React from "react";
import ApprovalRequestsTable from "@/components/shared/ApprovalRequestsTable";
import { mockPendingRequests } from "@/lib/mock-data/pending-requests";

export default function ExecutiveApprovePage() {
  return (
    <div className="w-full space-y-8 font-[family-name:var(--font-kanit)]">
      <div>
        <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">พิจารณาคำร้อง</h1>
        <p className="mt-1 text-sm text-slate-500">ตรวจสอบและพิจารณาอนุมัติคำร้อง</p>
      </div>

      <div className="w-full">
        <ApprovalRequestsTable requests={mockPendingRequests} />
      </div>
    </div>
  );
}

