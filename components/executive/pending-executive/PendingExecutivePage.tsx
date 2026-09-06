"use client";

import React from "react";
import RequestsListExecutive from "./RequestsList";

export default function PendingExecutivePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          คำร้องรอพิจารณา (ในฐานะผู้บริหาร)
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          รายการคำขอขอกู้ยืมที่ผ่านการตรวจสอบจากอาจารย์ที่ปรึกษาและเจ้าหน้าที่แล้ว รอการอนุมัติขั้นสุดท้าย
        </p>
      </div>

      <RequestsListExecutive />
    </div>
  );
}

