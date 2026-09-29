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

interface SuperAdminRequestsListProps {
  hideFilters?: boolean;
  dashboardMode?: "pending" | "all";
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

export default function SuperAdminRequestsList({
  hideFilters = false,
  dashboardMode = "all",
  initialRequests = [],
  highlightRequestId,
  serverQueue,
}: SuperAdminRequestsListProps) {
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
  const [requests, setRequests] = useState<ActionRequest[]>(initialRequests);
  const [prevInitialRequests, setPrevInitialRequests] = useState<ActionRequest[]>(initialRequests);

  if (initialRequests !== prevInitialRequests) {
    setPrevInitialRequests(initialRequests);
    setRequests(initialRequests);
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

  const pendingCount = serverQueue
    ? (paged.counts?.pending ?? 0)
    : requests.filter((req) => req.requestStatus === "pending_admin").length;
  const pendingExecutiveCount = serverQueue
    ? (paged.counts?.pendingExecutive ?? 0)
    : requests.filter((req) => req.requestStatus === "pending_executive").length;

  const filteredRequests = React.useMemo(() => {
    const list = requests.filter((req) => {
      if (dashboardMode === "pending") return req.requestStatus === "pending_admin";

      let isStatusMatch = false;
      if (filter === "all") isStatusMatch = true;
      else if (filter === "pending") isStatusMatch = req.requestStatus === "pending_admin";
      else if (filter === "pending_executive")
        isStatusMatch = req.requestStatus === "pending_executive";
      else if (filter === "approved")
        isStatusMatch = [
          "pending_executive",
          "pending_disbursement",
          "disbursed",
          "closed",
        ].includes(req.requestStatus);
      else if (filter === "rejected")
        isStatusMatch = req.requestStatus === "rejected";
      else if (filter === "cancelled")
        isStatusMatch = req.requestStatus === "cancelled";
      else
        isStatusMatch = req.requestStatus === filter;

      const lowerQuery = searchQuery.toLowerCase();
      const isSearchMatch =
        req.name.toLowerCase().includes(lowerQuery) || req.studentId.includes(lowerQuery);

      return isStatusMatch && isSearchMatch;
    });

    return sortRequestsBySubmissionDateDesc(list);
  }, [requests, dashboardMode, filter, searchQuery]);

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
            pendingExecutiveCount={pendingExecutiveCount}
            showExecutivePending={true}
            pendingLabel="รอตรวจสอบ (Admin)"
            showAllStatusOption
            statusOptions={COMPLETE_REQUEST_STATUS_OPTIONS}
          />
        </div>
      )}

      {/* ส่ง userRole="super_admin" เพื่อให้สิทธิ์ในการกดปุ่มแก้ไขวงเงิน */}
      <PagedListError failed={paged.failed} />
      <div className={paged.loading ? "opacity-50 transition-opacity" : undefined} aria-busy={paged.loading}>
        <RequestsCard
          requests={serverQueue ? paged.items : filteredRequests}
          userRole="super_admin"
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
