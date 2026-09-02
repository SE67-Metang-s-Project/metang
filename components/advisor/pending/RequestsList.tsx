"use client";

import React, { useState } from "react";
import PendingFilter, { FilterStatus } from "@/components/shared/pending/PendingFilter";
import RequestsCard, { ActionRequest } from "@/components/shared/pending/RequestsCard";
import { mockAdvisorRequests } from "@/components/shared/mockAdvisorRequests"; // นำเข้าข้อมูลจำลองที่เราแยกไฟล์ไว้

export default function RequestsList() {
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // ใช้ข้อมูลจำลองจาก mockAdvisorRequests มาตั้งเป็น State เริ่มต้น
  const [requests, setRequests] = useState<ActionRequest[]>(mockAdvisorRequests);

  // กรองข้อมูลตามสถานะและคำค้นหา
  const filteredRequests = requests.filter((req) => {
    let isStatusMatch = false;
    if (filter === "all") isStatusMatch = true;
    else if (filter === "pending") isStatusMatch = req.requestStatus === "รอพิจารณา";
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

      {/* <RequestsCard requests={filteredRequests} /> */}
      <RequestsCard requests={filteredRequests} userRole="advisor"/>
    </div>
  );
}
