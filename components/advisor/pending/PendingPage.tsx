"use client";

import React from "react";
import SharedRequestsList from "@/components/shared/pending/SharedRequestsList";
import type { ActionRequest } from "@/components/shared/pending/RequestsCard";

type AdvisorPendingPageProps = {
  initialRequests?: ActionRequest[];
  highlightRequestId?: string;
};

export default function AdvisorPendingPage({
  initialRequests = [],
  highlightRequestId,
}: AdvisorPendingPageProps) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          คำร้องรอพิจารณา (ในฐานะอาจารย์ที่ปรึกษา)
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
      />
    </div>
  );
}
