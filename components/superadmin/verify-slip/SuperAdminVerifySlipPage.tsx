// app/superadmin/verify-slip/page.tsx
"use client";

import React from "react";
// เรียกใช้ Shared Component
import SharedVerifySlipList from "@/components/shared/verify-slip/SharedVerifySlipList";
import type { ActionRequest as PendingActionRequest } from "@/components/shared/pending/RequestsCard";
import type { ActionRequest as VerifySlipActionRequest } from "@/components/shared/verify-slip/VerifySlipCard";

interface SuperAdminVerifySlipPageProps {
  initialRequests?: PendingActionRequest[] | VerifySlipActionRequest[];
}

export default function SuperAdminVerifySlipPage({
  initialRequests,
}: SuperAdminVerifySlipPageProps) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] mb-1">
          ตรวจสอบสลิปชำระเงิน (Super Admin)
        </h1>
        <p className="text-[13px] text-gray-500">
          ตรวจสอบและอนุมัติหลักฐานการโอนเงินที่นักศึกษาแนบเข้ามาในระบบ
        </p>
      </div>

      {/* ส่ง Role เข้าไป */}
      <SharedVerifySlipList userRole="super_admin" initialRequests={initialRequests} />
    </div>
  );
}
