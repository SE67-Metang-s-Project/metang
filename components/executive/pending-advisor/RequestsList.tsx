"use client";

import React, { useState } from "react";
import PendingFilter, { FilterStatus } from "@/components/shared/pending/PendingFilter";
import RequestsCard, {
  ActionRequest,
  sortRequestsBySubmissionDateDesc,
} from "@/components/shared/pending/RequestsCard";

interface RequestsListProps {
  initialRequests?: ActionRequest[];
}

export default function RequestsList({ initialRequests }: RequestsListProps = {}) {
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");

  const baseRequests = React.useMemo(() => {
    return initialRequests ?? [];
  }, [initialRequests]);

  const [requests, setRequests] = useState<ActionRequest[]>(baseRequests);
  const [prevInitialRequests, setPrevInitialRequests] = useState<ActionRequest[] | undefined>(initialRequests);

  if (initialRequests !== prevInitialRequests) {
    setPrevInitialRequests(initialRequests);
    setRequests(baseRequests);
  }

  const handleRequestDecided = (requestId: string, decision: string) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const nextStatus =
          decision === "approved"
            ? "pending_admin"
            : decision === "returned"
              ? "returned"
              : "rejected";
        return {
          ...req,
          requestStatus: nextStatus,
        };
      }),
    );
  };

  // นับจำนวนรายการที่รอ Advisor พิจารณา
  const pendingCount = requests.filter((req) => req.requestStatus === "pending_advisor").length;

  // กรองข้อมูลตามสถานะและคำค้นหา
  const filteredRequests = React.useMemo(() => {
    const list = requests.filter((req) => {
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
      }

      const lowerQuery = searchQuery.toLowerCase();
      const isSearchMatch =
        req.name.toLowerCase().includes(lowerQuery) || req.studentId.includes(lowerQuery);

      return isStatusMatch && isSearchMatch;
    });

    return sortRequestsBySubmissionDateDesc(list);
  }, [requests, filter, searchQuery]);

  return (
    <div className="w-full">
      <PendingFilter
        currentFilter={filter}
        onFilterChange={setFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        pendingCount={pendingCount} // ส่งจำนวนเข้าไปแสดงบน Badge
        pendingLabel="รอพิจารณา" // ตั้งชื่อแท็บให้เข้ากับ Advisor
        statusOptions={[
          { id: "approved", label: "อนุมัติแล้ว" },
          { id: "rejected", label: "ไม่อนุมัติ" },
          { id: "cancelled", label: "นักศึกษายกเลิกคำร้อง" },
        ]}
      />

      <RequestsCard
        requests={filteredRequests}
        userRole="advisor"
        onRequestDecided={handleRequestDecided}
      />
    </div>
  );
}
