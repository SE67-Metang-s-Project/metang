// components/shared/verify-slip/SharedVerifySlipList.tsx
"use client";

import React, { useState, useMemo } from "react";
import VerifySlipCard from "./VerifySlipCard";
import { mockAdminRequests } from "@/components/shared/mock-data/mockAdminRequests";

interface SharedVerifySlipListProps {
  userRole: "admin" | "super_admin";
}

export default function SharedVerifySlipList({ userRole }: SharedVerifySlipListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // กรองข้อมูล: เอาเฉพาะคำร้องที่มี paymentHistory (มีการแนบสลิป) มาแสดง
  const filteredRequests = useMemo(() => {
    return mockAdminRequests.filter((req) => {
      // 1. เช็คว่ามีประวัติสลิปหรือไม่ ถ้าไม่มีให้ข้ามไป
      const hasSlip = req.paymentHistory && req.paymentHistory.length > 0;
      if (!hasSlip) return false;

      // 2. ค้นหาจากชื่อหรือรหัสนักศึกษา (ถ้ามีการพิมพ์ค้นหา)
      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        return req.name.toLowerCase().includes(lowerQ) || req.studentId.includes(lowerQ);
      }

      return true;
    });
  }, [searchQuery]);

  return (
    <div className="w-full">
      {/* สามารถเพิ่มกล่องค้นหา (Search Box) ตรงนี้ได้เพื่อให้ใช้งานง่ายขึ้น */}
      <div className="mb-4 flex items-center justify-between">
        <input
          type="text"
          placeholder="ค้นหาชื่อ หรือ รหัสนักศึกษา..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        />
        <div className="text-[13px] text-gray-500">
          พบ {filteredRequests.length} รายการที่มีการแนบสลิป
        </div>
      </div>

      {/* เรียกใช้ Card และส่งข้อมูลที่กรองแล้วเข้าไป */}
      <VerifySlipCard requests={filteredRequests as any} userRole={userRole} />
    </div>
  );
}
