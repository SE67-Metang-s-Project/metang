"use client";

import React, { useState } from "react";
import PendingFilter, { FilterStatus } from "@/components/shared/pending/PendingFilter";
import RequestsCard, { ActionRequest } from "@/components/shared/pending/RequestsCard";
import { mockAdvisorRequests } from "@/components/shared/mock-data/mockAdvisorRequests";

export default function RequestsList() {
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");

  const [requests, setRequests] = useState<ActionRequest[]>(mockAdvisorRequests);

  // นับจำนวนรายการที่รอ Advisor พิจารณา
  const pendingCount = requests.filter((req) => req.requestStatus === "pending_advisor").length;

  // กรองข้อมูลตามสถานะและคำค้นหา
  const filteredRequests = requests.filter((req) => {
    let isStatusMatch = false;

    // === ลอจิกการกรอง (Filter) ของ Advisor โดยอิงจาก Enum ===
    if (filter === "all") {
      isStatusMatch = true;
    } else if (filter === "pending") {
      isStatusMatch = req.requestStatus === "pending_advisor";
    } else if (filter === "approved") {
      isStatusMatch = [
        "pending_admin",
        "pending_executive",
        "pending_disbursement",
        "disbursed",
        "closed",
      ].includes(req.requestStatus);
    } else if (filter === "rejected") {
      isStatusMatch = ["returned", "rejected", "cancelled"].includes(req.requestStatus);
    } else if (filter === "pending_admin") {
      isStatusMatch = req.requestStatus === "pending_admin";
    } else if (filter === "cancelled") {
      isStatusMatch = req.requestStatus === "cancelled";
    } else if (filter === "pending_executive") {
      isStatusMatch = req.requestStatus === "pending_executive";
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
        pendingLabel="รอพิจารณา" // ตั้งชื่อแท็บให้เข้ากับ Advisor
      />

      <RequestsCard requests={filteredRequests} userRole="advisor" />
    </div>
  );
}
