"use client";

import React, { useState } from "react";
import PendingFilter, { FilterStatus } from "@/components/shared/pending/PendingFilter"; // ใช้ตัวเดิม
import RequestsCard, { ActionRequest } from "@/components/shared/pending/RequestsCard"; // ใช้ตัวเดิม
import { mockAdminRequests } from "@/components/shared/mockAdminRequests"; // ดึง Mock data ของ Admin

export default function AdminRequestsList() {
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");

  const [requests, setRequests] = useState<ActionRequest[]>(mockAdminRequests);

  // กรองข้อมูลตามสถานะและคำค้นหา
  const filteredRequests = requests.filter((req) => {
    let isStatusMatch = false;
    if (filter === "all") isStatusMatch = true;
    else if (filter === "pending") isStatusMatch = req.requestStatus === "รอเจ้าหน้าที่ตรวจสอบ"; // เปลี่ยนคำให้ตรงกับ Admin
    else if (filter === "approved") isStatusMatch = req.requestStatus === "อนุมัติแล้ว";
    else if (filter === "rejected") isStatusMatch = req.requestStatus === "ไม่อนุมัติ";

    const lowerQuery = searchQuery.toLowerCase();
    const isSearchMatch =
      req.name.toLowerCase().includes(lowerQuery) || req.studentId.includes(lowerQuery);

    return isStatusMatch && isSearchMatch;
  });

  return (
    <div className="w-full">
      <PendingFilter
        currentFilter={filter}
        onFilterChange={setFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* ส่ง userRole="admin" เพื่อเปิดการเข้าถึงข้อมูลบัญชีธนาคาร และเปลี่ยนลอจิกปุ่ม */}
      <RequestsCard requests={filteredRequests} userRole="admin" />
    </div>
  );
}