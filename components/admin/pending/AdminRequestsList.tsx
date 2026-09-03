"use client";

import React, { useState } from "react";

import PendingFilter, { FilterStatus } from "@/components/shared/pending/PendingFilter";

import RequestsCard, { ActionRequest } from "@/components/shared/pending/RequestsCard";

import { mockAdminRequests } from "@/components/shared/mock-data/mockAdminRequests";

interface AdminRequestsListProps {
  hideFilters?: boolean;
  dashboardMode?: "pending" | "all";
}

export default function AdminRequestsList({
  hideFilters = false,
  dashboardMode = "all",
}: AdminRequestsListProps) {
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");

  const [requests] = useState<ActionRequest[]>(mockAdminRequests);

  // =====================================================
  // จำนวนคำร้องที่รอ Admin พิจารณา
  // =====================================================
  const pendingCount = requests.filter((req) => req.requestStatus === "pending_admin").length;

  // =====================================================
  // กรองข้อมูล
  // =====================================================
  const filteredRequests = requests.filter((req) => {
    // -----------------------------------------------------
    // Dashboard
    // แสดงเฉพาะ pending_admin
    // -----------------------------------------------------
    if (dashboardMode === "pending") {
      return req.requestStatus === "pending_admin";
    }

    // -----------------------------------------------------
    // หน้าเต็ม
    // ใช้ Filter ตามปกติ
    // -----------------------------------------------------
    let isStatusMatch = false;

    if (filter === "all") {
      isStatusMatch = true;
    } else if (filter === "pending") {
      isStatusMatch = req.requestStatus === "pending_admin";
    } else if (filter === "approved") {
      isStatusMatch = ["pending_executive", "pending_disbursement", "disbursed", "closed"].includes(
        req.requestStatus,
      );
    } else if (filter === "rejected") {
      isStatusMatch = ["returned", "rejected", "cancelled"].includes(req.requestStatus);
    }

    // -----------------------------------------------------
    // Search
    // -----------------------------------------------------
    const lowerQuery = searchQuery.toLowerCase();

    const isSearchMatch =
      req.name.toLowerCase().includes(lowerQuery) || req.studentId.includes(lowerQuery);

    return isStatusMatch && isSearchMatch;
  });

  return (
    <div className="w-full">
      {/* =====================================================
          Filter
          จะไม่แสดงเมื่ออยู่บน Dashboard
      ===================================================== */}
      {!hideFilters && (
        <div className="mb-4">
          <PendingFilter
            currentFilter={filter}
            onFilterChange={setFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            pendingCount={pendingCount}
            pendingLabel="รอตรวจสอบ"
          />
        </div>
      )}

      {/* =====================================================
          รายการ
      ===================================================== */}
      <RequestsCard requests={filteredRequests} userRole="admin" />
    </div>
  );
}
