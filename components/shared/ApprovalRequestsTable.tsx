"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { ActionRequest } from "@/components/advisor/pending/RequestsCard";
import RequestDetailsModal from "@/components/shared/RequestDetailsModal";

type Filter = "pending" | "all";

const actionStyles = {
  "รอพิจารณา": "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100",
  "อนุมัติแล้ว": "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  "ไม่อนุมัติ": "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  "ยกเลิกคำร้อง": "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
} as const;

const actionLabels = {
  "รอพิจารณา": "ตรวจสอบ",
  "อนุมัติแล้ว": "อนุมัติแล้ว",
  "ไม่อนุมัติ": "ไม่อนุมัติ",
  "ยกเลิกคำร้อง": "ยกเลิกคำร้อง",
} as const;

function formatAmount(amount: string) {
  return Number(amount).toLocaleString("th-TH");
}

export default function ApprovalRequestsTable({ requests }: { requests: ActionRequest[] }) {
  const [filter, setFilter] = useState<Filter>("pending");
  const [query, setQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<ActionRequest | null>(null);
  const status = (request: ActionRequest) => request.requestStatus ?? "รอพิจารณา";

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesFilter = filter === "all" || request.requestStatus === "รอพิจารณา";
      const action = status(request);
      const searchableText = [
        request.name,
        request.studentId,
        request.id,
        action,
        actionLabels[action],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        normalizedQuery === "อนุมัติ"
          ? action === "อนุมัติแล้ว"
          : searchableText.includes(normalizedQuery);
      return matchesFilter && matchesSearch;
    });
  }, [filter, query, requests]);

  return (
    <section className="w-full">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex w-fit items-center gap-1 rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm">
          <button onClick={() => setFilter("pending")} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === "pending" ? "bg-orange-50 text-orange-700 ring-1 ring-orange-200" : "text-gray-500 hover:bg-gray-50"}`}>
            รอพิจารณา
          </button>
          <button onClick={() => setFilter("all")} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === "all" ? "bg-orange-50 text-orange-700 ring-1 ring-orange-200" : "text-gray-500 hover:bg-gray-50"}`}>
            ทั้งหมด
          </button>
        </div>
        <label className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อ รหัส หรือจัดการ..." className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-4 pl-10 text-sm text-gray-900 shadow-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20" />
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-[980px] w-full text-sm font-normal">
          <thead className="border-b border-gray-200 bg-gray-50 text-center text-gray-600">
            <tr>
              <th className="border-r border-gray-200 px-4 py-3.5 font-semibold">รหัสคำร้อง</th><th className="border-r border-gray-200 px-4 py-3.5 font-semibold">ชื่อ-ข้อมูลนักศึกษา</th><th className="border-r border-gray-200 px-4 py-3.5 font-semibold">วันที่-เวลายื่นคำร้อง</th><th className="border-r border-gray-200 px-4 py-3.5 font-semibold">รายละเอียดคำร้อง</th><th className="border-r border-gray-200 px-4 py-3.5 font-semibold">จำนวนเงิน</th><th className="px-4 py-3.5 font-semibold">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRequests.map((request) => {
              const requestStatus = status(request);
              return <tr key={request.id} className="align-top transition-colors hover:bg-orange-50/30">
                <td className="whitespace-nowrap border-r border-gray-200 px-4 py-4 text-center text-gray-600">{request.id}</td>
                <td className="w-[290px] border-r border-gray-200 px-4 py-4"><p className="line-clamp-1 text-gray-900">{request.name} · {request.studentId}</p><p className="mt-1 line-clamp-1 text-gray-500">{request.major} · {request.degree ?? "ปริญญาตรี"} · ปี {request.year}</p></td>
                <td className="whitespace-nowrap border-r border-gray-200 px-4 py-4 text-center text-gray-600"><p>{request.submitDate}</p><p className="mt-1 text-gray-500">{request.submitTime ?? "-"}</p></td>
                <td className="w-[290px] border-r border-gray-200 px-4 py-4 leading-6 text-gray-700">{request.objective}</td>
                <td className="whitespace-nowrap border-r border-gray-200 px-4 py-4 text-center text-gray-900">{formatAmount(request.amount)}</td>
                <td className="px-4 py-4 text-center"><button onClick={() => setSelectedRequest(request)} className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm font-normal transition-colors ${actionStyles[requestStatus]}`}>{actionLabels[requestStatus]}</button></td>
              </tr>;
            })}
          </tbody>
        </table>
        {filteredRequests.length === 0 && <p className="py-12 text-center text-sm text-gray-500">ไม่พบคำร้องที่ค้นหา</p>}
      </div>

      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </section>
  );
}
