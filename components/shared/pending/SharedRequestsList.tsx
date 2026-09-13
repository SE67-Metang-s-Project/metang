// components/shared/pending/SharedRequestsList.tsx
"use client";

import React, { useState } from "react";
import PendingFilter, { FilterStatus } from "@/components/shared/pending/PendingFilter";
import RequestsCard, { ActionRequest, UserRole } from "@/components/shared/pending/RequestsCard";

interface SharedRequestsListProps {
  userRole: UserRole; // <--- รับ Role เข้ามาเพื่อตัดสินใจว่าจะ filter สถานะไหน
  hideFilters?: boolean;
  dashboardMode?: "pending" | "all";
  initialRequests?: ActionRequest[];
  highlightRequestId?: string;
}

export default function SharedRequestsList({
  userRole,
  hideFilters = false,
  dashboardMode = "all",
  initialRequests,
  highlightRequestId,
}: SharedRequestsListProps) {
  const [filter, setFilter] = useState<FilterStatus>(highlightRequestId ? "all" : "pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState<ActionRequest[]>(initialRequests ?? []);
  const [prevInitial, setPrevInitial] = useState(initialRequests);

  if (prevInitial !== initialRequests) {
    setPrevInitial(initialRequests);
    setRequests(initialRequests ?? []);
  }

  const handleRequestDecided = (requestId: string, decision: string) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        let newStatus = req.requestStatus;
        if (decision === "approved") {
          newStatus =
            userRole === "advisor"
              ? "pending_admin"
              : userRole === "admin"
                ? "pending_executive"
                : "pending_disbursement";
        } else if (decision === "rejected") {
          newStatus = "rejected";
        } else if (decision === "returned") {
          newStatus = "returned";
        }
        return { ...req, requestStatus: newStatus };
      }),
    );
  };

  // ฟังก์ชันเช็คว่า Role นี้ต้องดูคำร้องสถานะไหน
  const getTargetPendingStatus = (role: UserRole) => {
    switch (role) {
      case "advisor":
        return "pending_advisor";
      case "admin":
      case "super_admin":
        return "pending_admin"; // Admin กับ Super Admin ดูด่านเดียวกัน
      case "executive":
        return "pending_executive";
      default:
        return "pending_admin";
    }
  };

  const getPendingLabel = (role: UserRole) => {
    switch (role) {
      case "advisor":
        return "รอพิจารณา";
      case "executive":
        return "รออนุมัติ";
      case "super_admin":
        return "รอตรวจสอบ (Super Admin)";
      case "admin":
      default:
        return "รอตรวจสอบ";
    }
  };

  const targetPendingStatus = getTargetPendingStatus(userRole);
  const pendingCount = requests.filter((req) => req.requestStatus === targetPendingStatus).length;

  const filteredRequests = requests.filter((req) => {
    // โหมด Dashboard ดูเฉพาะที่รออนุมัติ
    if (dashboardMode === "pending") return req.requestStatus === targetPendingStatus;

    let isStatusMatch = false;

    // โหมด All ดูตาม Filter
    if (filter === "all") {
      isStatusMatch = true;
    } else if (filter === "pending") {
      isStatusMatch = req.requestStatus === targetPendingStatus;
    } else if (filter === "approved") {
      // ถ้าอนุมัติแล้ว สถานะจะขยับไปด่านถัดไป
      if (userRole === "admin" || userRole === "super_admin") {
        isStatusMatch = [
          "pending_executive",
          "pending_disbursement",
          "disbursed",
          "closed",
        ].includes(req.requestStatus);
      } else if (userRole === "advisor") {
        isStatusMatch = [
          "pending_admin",
          "pending_executive",
          "pending_disbursement",
          "disbursed",
          "closed",
        ].includes(req.requestStatus);
      } else if (userRole === "executive") {
        isStatusMatch = ["pending_disbursement", "disbursed", "closed"].includes(req.requestStatus);
      }
    } else if (filter === "rejected") {
      isStatusMatch = ["returned", "rejected"].includes(req.requestStatus);
    } else if (filter === "cancelled") {
      isStatusMatch = req.requestStatus === "cancelled";
    } else {
      isStatusMatch = req.requestStatus === filter;
    }

    const lowerQuery = searchQuery.toLowerCase().trim();
    const isSearchMatch =
      !lowerQuery ||
      req.name.toLowerCase().includes(lowerQuery) ||
      req.studentId.toLowerCase().includes(lowerQuery) ||
      req.id.toLowerCase().includes(lowerQuery);

    return isStatusMatch && isSearchMatch;
  });

  const advisorStatusOptions = [
    { id: "approved" as const, label: "อนุมัติแล้ว" },
    { id: "rejected" as const, label: "ไม่อนุมัติ / ส่งกลับแก้ไข" },
    { id: "cancelled" as const, label: "นักศึกษายกเลิกคำร้อง" },
  ];

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
            // เปลี่ยน Label ให้ตรงกับ Role แบบอัตโนมัติ
            pendingLabel={getPendingLabel(userRole)}
            statusOptions={userRole === "advisor" ? advisorStatusOptions : undefined}
          />
        </div>
      )}

      {/* ส่ง userRole ต่อไปให้ RequestsCard เพื่อเปิดปิดสิทธิ์แก้ตัวเลขวงเงิน */}
      <RequestsCard
        requests={filteredRequests}
        userRole={userRole}
        initialSelectedRequestId={highlightRequestId}
        onRequestDecided={handleRequestDecided}
      />
    </div>
  );
}
