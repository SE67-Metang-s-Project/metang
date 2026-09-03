"use client";

import React, { useState } from "react";
import PendingFilter, { FilterStatus } from "@/components/shared/pending/PendingFilter";
import RequestsCard, { ActionRequest } from "@/components/shared/pending/RequestsCard";
import { mockExecutiveRequests } from "@/components/shared/mock-data/mockExecutiveRequests"; 

export default function RequestsListExecutive() {
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");

  const [requests, setRequests] = useState<ActionRequest[]>(mockExecutiveRequests);

  // นับจำนวนรายการที่รอ "ผู้บริหาร" พิจารณา
  const pendingCount = requests.filter((req) => req.requestStatus === "pending_executive").length;

  // กรองข้อมูลตามสถานะและคำค้นหา
  const filteredRequests = requests.filter((req) => {
    let isStatusMatch = false;

    // === ลอจิกการกรอง (Filter) ของ Executive โดยอิงจาก Enum ===
    if (filter === "all") {
      isStatusMatch = true;
    } else if (filter === "pending") {
      isStatusMatch = req.requestStatus === "pending_executive";
    } else if (filter === "approved") {
      // สำหรับผู้บริหาร ถ้าอนุมัติแล้วจะไปรอโอนเงิน หรือโอนเสร็จแล้ว
      isStatusMatch = ["pending_disbursement", "disbursed", "closed"].includes(req.requestStatus);
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
        pendingCount={pendingCount} 
        pendingLabel="รออนุมัติ" 
      />

      {/* 
        ส่ง userRole="executive" เพื่อให้ระบบรู้ว่าตอนนี้กำลังดูในฐานะผู้บริหารขั้นสุดท้าย
      */}
      <RequestsCard requests={filteredRequests} userRole="executive" tableLayout="executive" />
    </div>
  );
}