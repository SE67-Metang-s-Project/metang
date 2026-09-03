"use client";

import React, { useState } from "react";
import PendingFilter, { FilterStatus } from "@/components/shared/pending/PendingFilter"; 
import RequestsCard, { ActionRequest } from "@/components/shared/pending/RequestsCard"; 
import { mockAdminRequests } from "@/components/shared/mock-data/mockAdminRequests"; 

interface AdminRequestsListProps {
  userRole?: "admin" | "executive";
  tableLayout?: "default" | "executive";
}

export default function AdminRequestsList({
  userRole = "admin",
  tableLayout = "executive",
}: AdminRequestsListProps) {
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");

  const [requests, setRequests] = useState<ActionRequest[]>(mockAdminRequests);

  // นับจำนวนรายการที่รอผู้ใช้ปัจจุบันดำเนินการ
  const pendingCount = requests.filter((req) => 
    userRole === "executive"
      ? req.requestStatus === "pending_executive"
      : ["pending_admin", "pending_disbursement"].includes(req.requestStatus)
  ).length;

  // กรองข้อมูลตามสถานะและคำค้นหา
  const filteredRequests = requests.filter((req) => {
    let isStatusMatch = false;

    // กรองตามสถานะที่แต่ละบทบาทต้องดำเนินการ
    if (filter === "all") {
      isStatusMatch = true;
    } else if (filter === "pending") {
      isStatusMatch = userRole === "executive"
        ? req.requestStatus === "pending_executive"
        : ["pending_admin", "pending_disbursement"].includes(req.requestStatus);
    } else if (filter === "approved") {
      isStatusMatch = ["pending_executive", "disbursed", "closed"].includes(req.requestStatus);
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
        pendingLabel={userRole === "executive" ? "รอพิจารณา" : "รอตรวจสอบ"}
      />

      <RequestsCard requests={filteredRequests} userRole={userRole} tableLayout={tableLayout} />
    </div>
  );
}
