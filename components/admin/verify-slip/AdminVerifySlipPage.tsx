// app/admin/verify-slip/page.tsx
"use client";

import React from "react";
// เรียกใช้ Shared Component
import SharedVerifySlipList from "@/components/shared/verify-slip/SharedVerifySlipList";
import type { ActionRequest as PendingActionRequest } from "@/components/shared/pending/RequestsCard";
import type { ActionRequest as VerifySlipActionRequest } from "@/components/shared/verify-slip/VerifySlipCard";

interface AdminVerifySlipPageProps {
  initialRequests?: PendingActionRequest[] | VerifySlipActionRequest[];
  // EXPERIMENT server-paging: total loans behind the first page
  initialTotal?: number;
}

export default function AdminVerifySlipPage({
  initialRequests,
  initialTotal,
}: AdminVerifySlipPageProps) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-[#1e293b] mb-1">
          ตรวจสอบสลิปชำระเงิน
        </h1>
        <p className="text-[13px] text-gray-500">
          ตรวจสอบและอนุมัติหลักฐานการโอนเงินที่นักศึกษาแนบเข้ามาในระบบ
        </p>
      </div>

      {/* ส่ง Role เข้าไป */}
      <SharedVerifySlipList
        userRole="admin"
        initialRequests={initialRequests}
        initialTotal={initialTotal}
      />
    </div>
  );
}
