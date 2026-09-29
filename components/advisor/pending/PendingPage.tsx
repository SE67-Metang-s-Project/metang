"use client";

import React from "react";
import SharedRequestsList from "@/components/shared/pending/SharedRequestsList";
import type { ActionRequest } from "@/components/shared/pending/RequestsCard";
import type { ServerQueue } from "@/hooks/useServerPagedList";

type AdvisorPendingPageProps = {
  initialRequests?: ActionRequest[];
  highlightRequestId?: string;
  // EXPERIMENT server-paging (revert: EXPERIMENT-server-paging.local.md)
  serverQueue?: ServerQueue;
};

export default function AdvisorPendingPage({
  initialRequests = [],
  highlightRequestId,
  serverQueue,
}: AdvisorPendingPageProps) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
          คำร้องรอพิจารณา
          <span aria-hidden="true" className="mx-2 inline-block size-2 rounded-full bg-current align-middle" />
          ในฐานะอาจารย์ที่ปรึกษา
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          รายการคำขอกู้ยืมจากนักศึกษาที่อยู่ในความดูแลของท่าน
          ซึ่งรอการพิจารณาและอนุมัติจากอาจารย์ที่ปรึกษา
        </p>
      </div>

      <SharedRequestsList
        userRole="advisor"
        initialRequests={initialRequests}
        highlightRequestId={highlightRequestId}
        serverQueue={serverQueue}
      />
    </div>
  );
}
