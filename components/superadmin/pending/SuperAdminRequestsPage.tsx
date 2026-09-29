"use client";

import React from "react";

// Import Component List ของ Super Admin ที่สร้างไว้
import SuperAdminRequestsList from "./SuperAdminRequestsList";
import type { ActionRequest } from "@/components/shared/pending/RequestsCard";
import type { ServerQueue } from "@/hooks/useServerPagedList";

type SuperAdminPendingPageProps = {
  initialRequests?: ActionRequest[];
  highlightRequestId?: string;
  // EXPERIMENT server-paging (revert: EXPERIMENT-server-paging.local.md)
  serverQueue?: ServerQueue;
};

export default function SuperAdminPendingPage({
  initialRequests = [],
  highlightRequestId,
  serverQueue,
}: SuperAdminPendingPageProps) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          คำร้องรอตรวจสอบ
          <span aria-hidden="true" className="mx-2 inline-block size-2 rounded-full bg-current align-middle" />
          ในฐานะเจ้าหน้าที่สูงสุด
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          ตรวจสอบคำร้องขอกู้ยืม ในฐานะผู้ดูแลระบบคุณสามารถพิจารณาและปรับแก้วงเงินได้
        </p>
      </div>

      <SuperAdminRequestsList
        initialRequests={initialRequests}
        highlightRequestId={highlightRequestId}
        serverQueue={serverQueue}
      />
    </div>
  );
}
