"use client";

import React, { useState } from "react";
import { mockPendingRequests } from "@/lib/mock-data/pending-requests";
import PendingFilter, { FilterStatus } from "@/components/shared/pending/PendingFilter";
import RequestsCard from "../pending/RequestsCard";

export default function RequestsList() {
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const requests = mockPendingRequests.map((request) => ({
    ...request,
    requestStatus: request.requestStatus ?? (request.id === "REQ-65001" ? "รอพิจารณา" : "อนุมัติแล้ว"),
  }));

  // 4. กรองข้อมูล
  const filteredRequests = requests.filter((req) => {
    let isStatusMatch = false;
    if (filter === "all") isStatusMatch = true;
    else if (filter === "pending") isStatusMatch = req.requestStatus === "รอพิจารณา";
    else if (filter === "approved") isStatusMatch = req.requestStatus === "อนุมัติแล้ว";
    else if (filter === "rejected") isStatusMatch = req.requestStatus === "ไม่อนุมัติ";

    // 2.2 กรองตามคำค้นหา (ชื่อ หรือ รหัสนักศึกษา)
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
        searchQuery={searchQuery} // 3. ส่งค่า state เข้าไป
        onSearchChange={setSearchQuery} // 4. ส่งฟังก์ชันอัปเดตค่าเข้าไป
      />

      <RequestsCard requests={filteredRequests} />
    </div>
  );
}
