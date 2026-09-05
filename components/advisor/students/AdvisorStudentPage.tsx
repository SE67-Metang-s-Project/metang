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
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">นักศึกษาในความดูแล</h1>
        <p className="text-sm text-gray-500 mt-1">
          รายชื่อและประวัติการกู้ยืมของนักศึกษาภายใต้การดูแล
        </p>
      </div>

      {/* เรียก Shared Component และส่งข้อมูลของฝั่ง Advisor เข้าไป */}
      <SharedStudentList rawRequests={initialRequests} />
    </div>
  );
}
