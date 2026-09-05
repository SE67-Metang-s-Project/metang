// app/executive/students/page.tsx
"use client";

import React from "react";
import SharedStudentList from "@/components/shared/students/SharedStudentList"; // เรียกตัวกลาง

// สมมติว่าฝั่ง Executive ดึงข้อมูลนักศึกษาทั้งหมดในคณะ (ใช้ mockAdminRequests หรือ mock แยกต่างหาก)
import { mockAdminRequests } from "@/components/shared/mock-data/mockAdminRequests";

export default function ExecutiveStudentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] mb-1">
          ข้อมูลนักศึกษาทั้งหมด
        </h1>
        <p className="text-[13px] text-gray-500">
          ภาพรวมรายชื่อและสถานะหนี้สินของนักศึกษาในคณะ
        </p>
      </div>

      {/* เรียก Shared Component และส่งข้อมูลทั้งหมดเข้าไป */}
      <SharedStudentList rawRequests={mockAdminRequests} />
    </div>
  );
}

