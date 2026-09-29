"use client";

import React, { useState } from "react";
import PendingFilter, {
  COMPLETE_REQUEST_STATUS_OPTIONS,
  FilterStatus,
} from "@/components/shared/pending/PendingFilter";
import { useServerPagedList } from "@/hooks/useServerPagedList";
import PagedListError from "@/components/shared/PagedListError";
import RequestsCard, {
  ActionRequest,
  sortRequestsBySubmissionDateDesc,
} from "@/components/shared/pending/RequestsCard";

interface RequestsListExecutiveProps {
  initialRequests?: ActionRequest[];
  highlightRequestId?: string;
  // EXPERIMENT server-paging (revert: EXPERIMENT-server-paging.local.md): the server sends page 1
  // of the initial filter ("pending", or "all" with a deep link); everything else is fetched.
  serverQueue?: {
    endpoint: string;
    initialTotal: number;
    initialCounts: { pending: number; pendingExecutive: number };
  };
}

export default function RequestsListExecutive({
  initialRequests,
  highlightRequestId,
  serverQueue,
}: RequestsListExecutiveProps = {}) {
  const initialFilter: FilterStatus = highlightRequestId ? "all" : "pending";
  const [filter, setFilterState] = useState<FilterStatus>(initialFilter);
  const [searchQuery, setSearchQueryState] = useState("");
  const [page, setPage] = useState(1);
  const setFilter = (next: FilterStatus) => {
    setFilterState(next);
    setPage(1);
  };
  const setSearchQuery = (next: string) => {
    setSearchQueryState(next);
    setPage(1);
  };

  const baseRequests = React.useMemo(() => {
    return initialRequests ?? [];
  }, [initialRequests]);

  const [requests, setRequests] = useState<ActionRequest[]>(baseRequests);
  const [prevInitialRequests, setPrevInitialRequests] = useState<ActionRequest[] | undefined>(initialRequests);

  if (initialRequests !== prevInitialRequests) {
    setPrevInitialRequests(initialRequests);
    setRequests(baseRequests);
  }

  const paged = useServerPagedList<ActionRequest, { pending: number; pendingExecutive: number }>({
    endpoint: serverQueue?.endpoint ?? "",
    params: { filter, q: searchQuery.trim(), page, limit: 5 },
    atInitialView: !serverQueue || (filter === initialFilter && !searchQuery.trim() && page === 1),
    initialItems: requests,
    initialTotal: serverQueue?.initialTotal ?? 0,
    initialCounts: serverQueue?.initialCounts,

    onPageOverflow: setPage,
  });

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
  const pendingCount = serverQueue
    ? (paged.counts?.pending ?? 0)
    : requests.filter((req) => req.requestStatus === "pending_executive").length;

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
      <PagedListError failed={paged.failed} />
      <div className={paged.loading ? "opacity-50 transition-opacity" : undefined} aria-busy={paged.loading}>
        <RequestsCard
          requests={serverQueue ? paged.items : filteredRequests}
          userRole="executive"
          tableLayout="executive"
          onRequestDecided={handleRequestDecided}
          initialSelectedRequestId={highlightRequestId}
          serverPaging={
            serverQueue ? { page, total: paged.total, pageSize: 5, onPageChange: setPage } : undefined
          }
        />
      </div>
    </div>
  );
}
