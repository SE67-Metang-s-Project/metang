"use client";

import React, { useState } from "react";
import PendingFilter, {
  COMPLETE_REQUEST_STATUS_OPTIONS,
  FilterStatus,
} from "@/components/shared/pending/PendingFilter";
import RequestsCard, {
  ActionRequest,
  sortRequestsBySubmissionDateDesc,
} from "@/components/shared/pending/RequestsCard";

interface RequestsListExecutiveProps {
  initialRequests?: ActionRequest[];
  highlightRequestId?: string;
}

export default function RequestsListExecutive({
  initialRequests,
  highlightRequestId,
}: RequestsListExecutiveProps = {}) {
  const [filter, setFilter] = useState<FilterStatus>(highlightRequestId ? "all" : "pending");
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
        const nextStatus = decision === "approved" ? "pending_disbursement" : "rejected";
        return {
          ...req,
          requestStatus: nextStatus,
        };
      }),
    );
  };

  // นับจำนวนรายการที่รอ "ผู้บริหาร" พิจารณา
  const pendingCount = requests.filter((req) => req.requestStatus === "pending_executive").length;

  // กรองข้อมูลตามสถานะและคำค้นหา
  const filteredRequests = React.useMemo(() => {
    const list = requests.filter((req) => {
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
        isStatusMatch = req.requestStatus === "rejected";
      } else if (filter === "cancelled") {
        isStatusMatch = req.requestStatus === "cancelled";
      } else {
        isStatusMatch = req.requestStatus === filter;
      }

      const lowerQuery = searchQuery.toLowerCase();
      const formattedAmount = Number(req.amount.replace(/[^\d.-]/g, "")).toLocaleString("en-US");
      const isSearchMatch = [
        req.id,
        req.studentId,
        req.amount,
        formattedAmount,
        req.name,
        req.objective,
        req.submitDate,
        ...(req.history?.map((entry) => entry.date) ?? []),
      ].some((value) => value.toLowerCase().includes(lowerQuery));

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
        searchPlaceholder="ค้นหารหัสคำร้อง ชื่อ วันที่..."
        pendingCount={pendingCount} 
        pendingLabel="รออนุมัติ" 
        showAllStatusOption
        statusOptions={COMPLETE_REQUEST_STATUS_OPTIONS}
      />

      {/* 
        ส่ง userRole="executive" เพื่อให้ระบบรู้ว่าตอนนี้กำลังดูในฐานะผู้บริหารขั้นสุดท้าย
      */}
      <RequestsCard
        requests={filteredRequests}
        userRole="executive"
        tableLayout="executive"
        onRequestDecided={handleRequestDecided}
        initialSelectedRequestId={highlightRequestId}
      />
    </div>
  );
}
