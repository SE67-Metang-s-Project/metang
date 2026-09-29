// app/advisor/students/page.tsx
"use client";

import React, { useMemo } from "react";
import SharedStudentList from "@/components/shared/students/SharedStudentList"; // เรียกตัวกลาง
import type { ActionRequest } from "@/components/shared/pending/RequestsCard";
import { filterAdvisorStudents } from "@/lib/advisor-students";

export { filterAdvisorStudents };

type AdvisorStudentPageProps = {
  initialRequests?: ActionRequest[];
  // EXPERIMENT server-paging (revert: EXPERIMENT-server-paging.local.md)
  initialTotal?: number;
};

export default function AdvisorStudentPage({
  initialRequests = [],
  initialTotal,
}: AdvisorStudentPageProps) {
  // กรองเฉพาะนักศึกษาที่ admin หรือ super admin โอนเงินให้แล้ว (disbursed) และยังชำระหนี้ไม่ครบ
  const activeRequests = useMemo(
    () => filterAdvisorStudents(initialRequests),
    [initialRequests],
  );

  return (
    <div className="advisor-students-min-text space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">นักศึกษาในความดูแล</h1>
        <p className="text-sm text-gray-500 mt-1">
          รายชื่อและประวัติการกู้ยืมของนักศึกษาภายใต้การดูแลที่ได้รับการโอนเงินแล้วและอยู่ระหว่างผ่อนชำระ
        </p>
      </div>

      {/* เรียก Shared Component และส่งข้อมูลของฝั่ง Advisor เข้าไป */}
      <SharedStudentList
        rawRequests={activeRequests}
        filterTabs={["ทั้งหมด", "ชำระตรงเวลา", "เคยชำระล่าช้า"]}
        serverStudents={
          initialTotal === undefined ? undefined : { endpoint: "/api/advisor/students", initialTotal }
        }
      />
    </div>
  );
}
