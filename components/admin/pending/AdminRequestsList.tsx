"use client";

import React, { useState } from "react";
import PendingFilter, { FilterStatus } from "@/components/shared/pending/PendingFilter"; 
import RequestsCard, { ActionRequest } from "@/components/shared/pending/RequestsCard"; 
import { mockAdminRequests } from "@/components/shared/mock-data/mockAdminRequests"; 

export default function AdminRequestsList() {
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");

  const [requests, setRequests] = useState<ActionRequest[]>(mockAdminRequests);

  // นับจำนวนรายการที่รอ Admin ทำงาน (ทั้งตรวจสอบเอกสารและเบิกจ่าย)
  const pendingCount = requests.filter((req) => 
    ["pending_admin", "pending_disbursement"].includes(req.requestStatus)
  ).length;

  // กรองข้อมูลตามสถานะและคำค้นหา
  const filteredRequests = requests.filter((req) => {
    let isStatusMatch = false;

    // === ลอจิกการกรอง (Filter) ของ Admin โดยอิงจาก Enum ===
    if (filter === "all") {
      isStatusMatch = true;
    } else if (filter === "pending") {
      isStatusMatch = ["pending_admin", "pending_disbursement"].includes(req.requestStatus);
    } else if (filter === "approved") {
      isStatusMatch = ["pending_executive", "disbursed", "closed"].includes(req.requestStatus);
    } else if (filter === "rejected") {
      isStatusMatch = ["returned", "rejected", "cancelled"].includes(req.requestStatus);
    }

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
        pendingCount={pendingCount} // ส่งจำนวนเข้าไปแสดงบน Badge
        pendingLabel="รอตรวจสอบ" // ตั้งชื่อแท็บให้เข้ากับ Admin
      />

      {/* ส่ง userRole="admin" เพื่อเปิดการเข้าถึงข้อมูลบัญชีธนาคาร และเปลี่ยนลอจิกปุ่ม */}
      <RequestsCard requests={filteredRequests} userRole="admin" />
    </div>
  );
}