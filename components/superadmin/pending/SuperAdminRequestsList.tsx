"use client";

import React, { useState } from "react";
import PendingFilter, { FilterStatus } from "@/components/shared/pending/PendingFilter";
import RequestsCard, { ActionRequest } from "@/components/shared/pending/RequestsCard";

interface SuperAdminRequestsListProps {
  hideFilters?: boolean;
  dashboardMode?: "pending" | "all";
  initialRequests?: ActionRequest[];
}

export default function SuperAdminRequestsList({
  hideFilters = false,
  dashboardMode = "all",
  initialRequests = [],
}: SuperAdminRequestsListProps) {
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState<ActionRequest[]>(initialRequests);
  const [prevInitialRequests, setPrevInitialRequests] = useState<ActionRequest[]>(initialRequests);

  if (initialRequests !== prevInitialRequests) {
    setPrevInitialRequests(initialRequests);
    setRequests(initialRequests);
  }

  const handleRequestDecided = (requestId: string, decision: string) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              requestStatus:
                decision === "approved"
                  ? "pending_executive"
                  : decision === "returned"
                    ? "returned"
                    : "rejected",
            }
          : req,
      ),
    );
  };

  const pendingCount = requests.filter((req) => req.requestStatus === "pending_admin").length;

  const filteredRequests = requests.filter((req) => {
    if (dashboardMode === "pending") return req.requestStatus === "pending_admin";

    let isStatusMatch = false;
    if (filter === "all") isStatusMatch = true;
    else if (filter === "pending") isStatusMatch = req.requestStatus === "pending_admin";
    else if (filter === "approved") isStatusMatch = ["pending_executive", "pending_disbursement", "disbursed", "closed"].includes(req.requestStatus);
    else if (filter === "rejected") isStatusMatch = ["returned", "rejected", "cancelled"].includes(req.requestStatus);

    const lowerQuery = searchQuery.toLowerCase();
    const isSearchMatch = req.name.toLowerCase().includes(lowerQuery) || req.studentId.includes(lowerQuery);

    return isStatusMatch && isSearchMatch;
  });

  return (
    <div className="w-full">
      {!hideFilters && (
        <div className="mb-4">
          <PendingFilter
            currentFilter={filter}
            onFilterChange={setFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            pendingCount={pendingCount}
            pendingLabel="รอตรวจสอบ (Admin)"
          />
        </div>
      )}

      {/* ส่ง userRole="super_admin" เพื่อให้สิทธิ์ในการกดปุ่มแก้ไขวงเงิน */}
      <RequestsCard
        requests={filteredRequests}
        userRole="super_admin"
        onRequestDecided={handleRequestDecided}
      />
    </div>
  );
}