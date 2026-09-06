"use client";

import React from "react";
import PendingRequestsList from "./RequestsList";

import type { ActionRequest } from "@/components/shared/pending/RequestsCard";

type PendingAdvisorPageProps = {
  initialRequests?: ActionRequest[];
};

export default function PendingPage({ initialRequests }: PendingAdvisorPageProps) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          คำร้องรอพิจารณา (ในฐานะอาจารย์ที่ปรึกษา)
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          รายการคำขอขอกู้ยืมของนักศึกษาในความดูแลที่รอการอนุมัติจากคุณ
        </p>
      </div>

      {/* แสดงรายการคำขอที่รอดำเนินการ */}
      <PendingRequestsList initialRequests={initialRequests} />
    </div>
  );
}

