"use client";

import React from "react";
import SharedRequestsList from "@/components/shared/pending/SharedRequestsList";
import type { ActionRequest } from "@/components/shared/pending/RequestsCard";
import type { ServerQueue } from "@/hooks/useServerPagedList";

type AdminPendingPageProps = {
  initialRequests?: ActionRequest[];
  highlightRequestId?: string;
  // EXPERIMENT server-paging (revert: EXPERIMENT-server-paging.local.md)
  serverQueue?: ServerQueue;
};

export default function PendingPage({
  initialRequests,
  highlightRequestId,
  serverQueue,
}: AdminPendingPageProps) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
          คำร้องรอตรวจสอบ
          <span aria-hidden="true" className="mx-2 inline-block size-2 rounded-full bg-current align-middle" />
          ในฐานะผู้ดูแลระบบ
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          ตรวจสอบคำร้องขอกู้ยืมของนักศึกษาที่รอการพิจารณาและอนุมัติจากอาจารย์ที่ปรึกษา
        </p>
      </div>

      <SharedRequestsList
        userRole="admin"
        initialRequests={initialRequests}
        highlightRequestId={highlightRequestId}
        serverQueue={serverQueue}
      />
    </div>
  );
}
