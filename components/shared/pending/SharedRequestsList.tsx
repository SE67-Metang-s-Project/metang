// components/shared/pending/SharedRequestsList.tsx
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
  UserRole,
  sortRequestsBySubmissionDateDesc,
} from "@/components/shared/pending/RequestsCard";

interface SharedRequestsListProps {
  userRole: UserRole; // <--- รับ Role เข้ามาเพื่อตัดสินใจว่าจะ filter สถานะไหน
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

export default function SharedRequestsList({
  userRole,
  hideFilters = false,
  dashboardMode = "all",
  initialRequests,
  highlightRequestId,
  serverQueue,
}: SharedRequestsListProps) {
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
  const [requests, setRequests] = useState<ActionRequest[]>(initialRequests ?? []);
  const [prevInitial, setPrevInitial] = useState(initialRequests);

  if (prevInitial !== initialRequests) {
    setPrevInitial(initialRequests);
    setRequests(initialRequests ?? []);
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
        let newStatus = req.requestStatus;
        if (decision === "approved") {
          newStatus =
            userRole === "advisor"
              ? "pending_admin"
              : userRole === "admin" || userRole === "super_admin"
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
  const pendingCount = serverQueue
    ? (paged.counts?.pending ?? 0)
    : requests.filter((req) => req.requestStatus === targetPendingStatus).length;
  const showExecutivePending = userRole === "admin" || userRole === "super_admin";
  const pendingExecutiveCount = showExecutivePending
    ? serverQueue
      ? (paged.counts?.pendingExecutive ?? 0)
      : requests.filter((req) => req.requestStatus === "pending_executive").length
    : undefined;

  const filteredRequests = React.useMemo(() => {
    const list = requests.filter((req) => {
      // โหมด Dashboard ดูเฉพาะที่รออนุมัติ
      if (dashboardMode === "pending") return req.requestStatus === targetPendingStatus;

      let isStatusMatch = false;

      // โหมด All ดูตาม Filter
      if (filter === "all") {
        isStatusMatch = true;
      } else if (filter === "pending") {
        isStatusMatch = req.requestStatus === targetPendingStatus;
      } else if (filter === "pending_executive") {
        isStatusMatch = req.requestStatus === "pending_executive";
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
        isStatusMatch = req.requestStatus === "rejected";
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

    return sortRequestsBySubmissionDateDesc(list);
  }, [requests, dashboardMode, targetPendingStatus, filter, userRole, searchQuery]);

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
            showExecutivePending={showExecutivePending}
            // เปลี่ยน Label ให้ตรงกับ Role แบบอัตโนมัติ
            pendingLabel={getPendingLabel(userRole)}
            showAllStatusOption
            searchPlaceholder={
              userRole === "advisor" ? "ค้นหารหัสคำร้อง ชื่อ..." : undefined
            }
            statusOptions={COMPLETE_REQUEST_STATUS_OPTIONS}
          />
        </div>
      )}

      {/* ส่ง userRole ต่อไปให้ RequestsCard เพื่อเปิดปิดสิทธิ์แก้ตัวเลขวงเงิน */}
      <PagedListError failed={paged.failed} />
      <div className={paged.loading ? "opacity-50 transition-opacity" : undefined} aria-busy={paged.loading}>
        <RequestsCard
          requests={serverQueue ? paged.items : filteredRequests}
          userRole={userRole}
          initialSelectedRequestId={highlightRequestId}
          onRequestDecided={handleRequestDecided}
          serverPaging={
            serverQueue ? { page, total: paged.total, pageSize: 5, onPageChange: setPage } : undefined
          }
        />
      </div>
    </div>
  );
}
