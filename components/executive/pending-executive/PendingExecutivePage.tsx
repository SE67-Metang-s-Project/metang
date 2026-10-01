"use client";

import React from "react";
import RequestsListExecutive from "./RequestsList";
import type { ActionRequest } from "@/components/shared/pending/RequestsCard";
import type { ServerQueue } from "@/hooks/useServerPagedList";

type PendingExecutivePageProps = {
  initialRequests?: ActionRequest[];
  highlightRequestId?: string;
  // EXPERIMENT server-paging (revert: EXPERIMENT-server-paging.local.md)
  serverQueue?: ServerQueue;
};

export default function PendingExecutivePage({
  initialRequests,
  highlightRequestId,
  serverQueue,
}: PendingExecutivePageProps) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          คำร้องรอพิจารณา (ในฐานะผู้บริหาร)
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          รายการคำขอขอกู้ยืมที่ผ่านการตรวจสอบจากอาจารย์ที่ปรึกษาและผู้ดูแลระบบแล้ว รอการอนุมัติขั้นสุดท้าย
        </p>
      </div>

      <RequestsListExecutive
        initialRequests={initialRequests}
        highlightRequestId={highlightRequestId}
        serverQueue={serverQueue}
      />
    </div>
  );
}
