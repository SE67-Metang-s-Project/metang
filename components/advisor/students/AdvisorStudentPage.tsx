// app/advisor/students/page.tsx
"use client";

import React from "react";
import SharedStudentList from "@/components/shared/students/SharedStudentList"; // เรียกตัวกลาง
import type { ActionRequest } from "@/components/shared/pending/RequestsCard";

type AdvisorStudentPageProps = {
  initialRequests?: ActionRequest[];
};

export default function AdvisorStudentPage({
  initialRequests = [],
}: AdvisorStudentPageProps) {
  // กรองเฉพาะนักศึกษาที่ admin หรือ super admin โอนเงินให้แล้ว (disbursed) และยังชำระหนี้ไม่ครบ
  const activeRequests = initialRequests.filter((req) => {
    if (req.requestStatus !== "disbursed") return false;
    const totalDue =
      req.installments && req.installments.length > 0
        ? req.installments.reduce((sum, inst) => sum + Number(inst.amount || 0), 0)
        : Number(req.approvedAmount ?? req.amount ?? 0);
    const totalPaid =
      req.installments && req.installments.length > 0
        ? req.installments.reduce((sum, inst) => sum + Number(inst.paidAmount || 0), 0)
        : 0;
    const remainingBalance = Math.max(0, totalDue - totalPaid);
    return remainingBalance > 0;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">นักศึกษาในความดูแล</h1>
        <p className="text-sm text-gray-500 mt-1">
          รายชื่อและประวัติการกู้ยืมของนักศึกษาภายใต้การดูแลที่ได้รับการโอนเงินแล้วและอยู่ระหว่างผ่อนชำระ
        </p>
      </div>

      {/* เรียก Shared Component และส่งข้อมูลของฝั่ง Advisor เข้าไป */}
      <SharedStudentList
        rawRequests={activeRequests}
        filterTabs={["ทั้งหมด", "ชำระตรงเวลา", "เคยชำระล่าช้า"]}
      />
    </div>
  );
}
