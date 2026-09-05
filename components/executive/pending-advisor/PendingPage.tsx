"use client";

import React from "react";
import PendingRequestsList from "./RequestsList";

export default function PendingPage() {
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
      <PendingRequestsList />
    </div>
  );
}

