"use client";

import React from "react";
import SharedRequestsList from "@/components/shared/pending/SharedRequestsList";
import type { ActionRequest } from "@/components/shared/pending/RequestsCard";

type AdminPendingPageProps = {
  initialRequests?: ActionRequest[];
};

export default function PendingPage({ initialRequests }: AdminPendingPageProps) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">คำร้องรอพิจารณา (Admin)</h1>
        <p className="text-gray-500 mt-1 text-sm">
          ตรวจสอบคำร้องขอกู้ยืมของนักศึกษาที่รอการพิจารณาและอนุมัติจากอาจารย์ที่ปรึกษา
        </p>
      </div>

      <SharedRequestsList userRole="admin" initialRequests={initialRequests} />
    </div>
  );
}
