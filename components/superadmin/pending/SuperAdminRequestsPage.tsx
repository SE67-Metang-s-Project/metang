"use client";

import React from "react";

// Import Component List ของ Super Admin ที่สร้างไว้
import SuperAdminRequestsList from "./SuperAdminRequestsList";
import type { ActionRequest } from "@/components/shared/pending/RequestsCard";

type SuperAdminPendingPageProps = {
  initialRequests?: ActionRequest[];
};

export default function SuperAdminPendingPage({
  initialRequests = [],
}: SuperAdminPendingPageProps) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          คำร้องรอพิจารณา (Super Admin)
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          ตรวจสอบคำร้องขอกู้ยืม ในฐานะผู้ดูแลระบบคุณสามารถพิจารณาและปรับแก้วงเงินได้
        </p>
      </div>

      <SuperAdminRequestsList initialRequests={initialRequests} />
    </div>
  );
}
