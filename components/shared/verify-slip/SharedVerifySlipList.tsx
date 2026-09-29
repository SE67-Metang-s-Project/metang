// components/shared/verify-slip/SharedVerifySlipList.tsx
"use client";

import React, { useState, useMemo } from "react";
import VerifySlipCard, { ActionRequest } from "./VerifySlipCard";
import type { ActionRequest as PendingActionRequest } from "@/components/shared/pending/RequestsCard";
import PagedListError from "@/components/shared/PagedListError";
import { useServerPagedList } from "@/hooks/useServerPagedList";

// EXPERIMENT verify-slip-paging (revert: EXPERIMENT-verify-slip-paging.local.md)
// With `initialTotal` set (Admin and SuperAdmin pages) the server sends only page 1 and this list fetches
// other pages and search results from GET /api/admin/verify-slip. Without it
// it behaves as before.
const PAGE_SIZE = 5;

interface SharedVerifySlipListProps {
  userRole: "admin" | "super_admin";
  initialRequests?: PendingActionRequest[] | ActionRequest[];
  initialTotal?: number;
}

export default function SharedVerifySlipList({
  userRole,
  initialRequests,
  initialTotal,
}: SharedVerifySlipListProps) {
  const [searchQuery, setSearchQueryState] = useState("");
  const [page, setPage] = useState(1);
  const setSearchQuery = (next: string) => {
    setSearchQueryState(next);
    setPage(1);
  };
  const serverPaged = initialTotal !== undefined;

  const rawRequests = useMemo(() => {
    return (initialRequests ?? []) as ActionRequest[];
  }, [initialRequests]);

  // Page 1 without a search is what the server rendered (and router.refresh() replaces it after a
  // decision); any other view is fetched.
  const paged = useServerPagedList<ActionRequest>({
    endpoint: "/api/admin/verify-slip",
    params: { q: searchQuery, page, limit: PAGE_SIZE },
    atInitialView: !serverPaged || (page === 1 && !searchQuery),
    initialItems: rawRequests,
    initialTotal: initialTotal ?? 0,

    onPageOverflow: setPage,
  });

  // กรองข้อมูล: เอาเฉพาะคำร้องที่มี paymentHistory (มีการแนบสลิป) มาแสดง
  const filteredRequests = useMemo(() => {
    return rawRequests.filter((req: ActionRequest) => {
      // 1. เช็คว่ามีประวัติสลิปหรือไม่ ถ้าไม่มีให้ข้ามไป
      const hasSlip = Boolean(req.paymentHistory && req.paymentHistory.length > 0);
      if (!hasSlip) return false;

      // 2. ค้นหาจากชื่อหรือรหัสนักศึกษา (ถ้ามีการพิมพ์ค้นหา)
      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        return (
          req.name?.toLowerCase().includes(lowerQ) ||
          req.studentId?.includes(lowerQ)
        );
      }

      return true;
    });
  }, [rawRequests, searchQuery]);

  const shown = serverPaged ? paged.items : filteredRequests;
  const total = serverPaged ? paged.total : filteredRequests.length;

  return (
    <div className="w-full">
      {/* สามารถเพิ่มกล่องค้นหา (Search Box) ตรงนี้ได้เพื่อให้ใช้งานง่ายขึ้น */}
      <div className="mb-4 flex items-center justify-between">
        <input
          type="text"
          placeholder="ค้นหาชื่อ หรือ รหัสนักศึกษา..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        />
        <div className="text-[13px] text-gray-500">
          พบ {total} รายการที่มีการแนบสลิป
        </div>
      </div>

      {/* เรียกใช้ Card และส่งข้อมูลที่กรองแล้วเข้าไป */}
      <PagedListError failed={paged.failed} />
      <div className={paged.loading ? "opacity-50 transition-opacity" : undefined} aria-busy={paged.loading}>
        <VerifySlipCard
          requests={shown}
          userRole={userRole}
          serverPaging={
            serverPaged ? { page, total, pageSize: PAGE_SIZE, onPageChange: setPage } : undefined
          }
        />
      </div>
    </div>
  );
}
