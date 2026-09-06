"use client";

import React, { useState } from "react";
import PendingFilter, { FilterStatus } from "@/components/shared/pending/PendingFilter";
import RequestsCard, { ActionRequest } from "@/components/shared/pending/RequestsCard";
import { mockExecutiveRequests } from "@/components/shared/mock-data/mockExecutiveRequests"; 

interface RequestsListExecutiveProps {
  initialRequests?: ActionRequest[];
}

export default function RequestsListExecutive({
  initialRequests,
}: RequestsListExecutiveProps = {}) {
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");

  const baseRequests = React.useMemo(() => {
    if (initialRequests && initialRequests.length > 0) {
      return initialRequests;
    }
    return initialRequests ?? mockExecutiveRequests;
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
    } else if (filter === "cancelled") {
      isStatusMatch = req.requestStatus === "cancelled";
    } else if (filter === "pending_admin") {
      isStatusMatch = req.requestStatus === "pending_admin";
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
        statusOptions={[
          { id: "approved", label: "อนุมัติแล้ว" },
          { id: "rejected", label: "ไม่อนุมัติ" },
          { id: "cancelled", label: "นักศึกษายกเลิกคำร้อง" },
          { id: "pending_admin", label: "รอเจ้าหน้าที่ตรวจสอบ" },
        ]}
      />

      {/* 
        ส่ง userRole="executive" เพื่อให้ระบบรู้ว่าตอนนี้กำลังดูในฐานะผู้บริหารขั้นสุดท้าย
      */}
      <RequestsCard
        requests={filteredRequests}
        userRole="executive"
        tableLayout="executive"
        onRequestDecided={handleRequestDecided}
      />
    </div>
  );
}
