// components/shared/disburse-debt/SharedDisburseDebtList.tsx
"use client";

import React, { useState } from "react";
import DisburseDebtCard, { ActionRequest } from "./DisburseDebtCard";
import StudentFilters from "@/components/shared/filter/StudentFilters";
import PagedListError from "@/components/shared/PagedListError";
import { useServerPagedList } from "@/hooks/useServerPagedList";

// EXPERIMENT disburse-debt-paging (revert: EXPERIMENT-disburse-debt-paging.local.md)
// With `initialTotal` set (Admin and SuperAdmin pages) the server sends only page 1 of the "pending" tab and this
// list fetches every other page, tab, search and degree filter from
// GET /api/admin/disburse-debt. Without it it behaves as before.
const PAGE_SIZE = 5;
const TAB_PARAM: Record<string, string> = { "รอโอนเงิน": "pending", "โอนแล้ว": "done" };

interface SharedDisburseDebtListProps {
  userRole?: "admin" | "super_admin";
  initialRequests?: ActionRequest[];
  initialTotal?: number;
}

export default function SharedDisburseDebtList({
  initialRequests = [],
  initialTotal,
}: SharedDisburseDebtListProps) {
  const requests = initialRequests;

  // State สำหรับตัวกรอง
  const [activeTab, setActiveTab] = useState("รอโอนเงิน");
  const filterTabs = ["ทั้งหมด", "รอโอนเงิน", "โอนแล้ว"];

  const [searchQuery, setSearchQuery] = useState("");
  const [degreeFilter, setDegreeFilter] = useState("ทั้งหมด");

  const serverPaged = initialTotal !== undefined;
  const [page, setPage] = useState(1);

  // The pending first page is what the server rendered, and router.refresh() replaces it after
  // a disbursement. Any other view is fetched.
  const tab = TAB_PARAM[activeTab] ?? "all";
  const degree = degreeFilter === "ทั้งหมด" ? "" : degreeFilter;
  const paged = useServerPagedList<ActionRequest>({
    endpoint: "/api/admin/disburse-debt",
    params: { tab, q: searchQuery, degree, page, limit: PAGE_SIZE },
    atInitialView: !serverPaged || (tab === "pending" && !searchQuery && !degree && page === 1),
    initialItems: requests,
    initialTotal: initialTotal ?? 0,

    onPageOverflow: setPage,
  });

  // Logic ในการกรองข้อมูล
  const filteredRequests = requests.filter((req) => {
    // Search
    const matchSearch =
      req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.studentId.includes(searchQuery);

    // Status
    let matchTab = true;
    if (activeTab === "รอโอนเงิน") {
      matchTab = req.requestStatus === "pending_disbursement";
    } else if (activeTab === "โอนแล้ว") {
      matchTab = req.requestStatus === "disbursed" || req.requestStatus === "closed";
    } else {
      // โหมด "ทั้งหมด" ควรแสดงเฉพาะคนที่ผ่านการอนุมัติมาถึงขั้นตอนโอนเงินแล้ว
      matchTab = ["pending_disbursement", "disbursed", "closed"].includes(req.requestStatus);
    }

    // Degree
    const matchDegree = degreeFilter === "ทั้งหมด" || req.major.includes(degreeFilter);

    return matchSearch && matchTab && matchDegree;
  });

  const shown = serverPaged ? paged.items : filteredRequests;
  const pendingCount = serverPaged
    ? (initialTotal ?? 0)
    : requests.filter((request) => request.requestStatus === "pending_disbursement").length;

  // Any filter change goes back to page 1.
  const onFilter = <T,>(set: (value: T) => void) => (value: T) => {
    set(value);
    setPage(1);
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <StudentFilters
          activeTab={activeTab}
          setActiveTab={onFilter(setActiveTab)}
          filterTabs={filterTabs}
          filterTabCounts={{ "รอโอนเงิน": pendingCount }}
          searchQuery={searchQuery}
          setSearchQuery={onFilter(setSearchQuery)}
          degreeFilter={degreeFilter}
          setDegreeFilter={onFilter(setDegreeFilter)}
        />
      </div>

      {/* เรียกใช้งาน Card พร้อมส่งข้อมูลที่ถูกกรองแล้ว */}
      <PagedListError failed={paged.failed} />
      <div className={paged.loading ? "opacity-50 transition-opacity" : undefined} aria-busy={paged.loading}>
        <DisburseDebtCard
          requests={shown as unknown as ActionRequest[]}
          serverPaging={
            serverPaged ? { page, total: paged.total, pageSize: PAGE_SIZE, onPageChange: setPage } : undefined
          }
        />
      </div>
    </div>
  );
}
