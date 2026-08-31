"use client";

import React, { useState } from "react";
import PendingFilter, { FilterStatus } from "../pending/PendingFilter";
import RequestsCard from "../pending/RequestsCard";

export default function RequestsList() {
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  // 2. ปรับข้อมูลจำลองให้ตรงกับ Type ActionRequest ของ RequestsCard
  const [requests, setRequests] = useState([
    {
      id: "REQ-65001",
      name: "สมชาย ใจดี",
      studentId: "65010001",
      major: "วิศวกรรมคอมพิวเตอร์",
      year: "3",
      requestStatus: "รอพิจารณา", // ฟิลด์นี้เอาไว้ใช้กับ Filter
      objective:
        "เพื่อชำระค่าลงทะเบียนเรียนภาคการศึกษาที่ 1/2567 เนื่องจากทางบ้านขาดรายได้กะทันหัน",
      amount: "45000",
      term: "2",
      submitDate: "15 ส.ค. 2567",
      waitDays: 5,
      isOverdue: false,
      history: [{ action: "ยื่นคำขอกู้ยืม", date: "15 ส.ค. 2567", actor: "สมชาย ใจดี" }],
      paymentBehavior: {
        onTimeStatusLabel: "ชำระตรงเวลา",
        onTimeInstallments: 12,
        lateInstallments: 0,
        totalLoanRequests: 2,
        totalInstallments: 12,
      },
    },
    {
      id: "REQ-65002",
      name: "มานี มีนา",
      studentId: "65010002",
      major: "วิทยาการคอมพิวเตอร์",
      year: "3",
      requestStatus: "อนุมัติแล้ว", // ฟิลด์นี้เอาไว้ใช้กับ Filter
      objective: "เพื่อเป็นค่าใช้จ่ายรายเดือนและค่าอุปกรณ์การเรียน",
      amount: "20000",
      term: "3",
      submitDate: "10 ส.ค. 2567",
      waitDays: 0,
      isOverdue: false,
      history: [
        { action: "ยื่นคำขอกู้ยืม", date: "10 ส.ค. 2567", actor: "มานี มีนา" },
        { action: "อนุมัติคำร้อง", date: "12 ส.ค. 2567", actor: "อ.ที่ปรึกษา" },
      ],
      paymentBehavior: {
        onTimeStatusLabel: "ค้างชำระ",
        onTimeInstallments: 8,
        lateInstallments: 2,
        totalLoanRequests: 3,
        totalInstallments: 10,
      },
    },
  ]);

  // 4. กรองข้อมูล
  const filteredRequests = requests.filter((req) => {
    let isStatusMatch = false;
    if (filter === "all") isStatusMatch = true;
    else if (filter === "pending") isStatusMatch = req.requestStatus === "รอพิจารณา";
    else if (filter === "approved") isStatusMatch = req.requestStatus === "อนุมัติแล้ว";
    else if (filter === "rejected") isStatusMatch = req.requestStatus === "ไม่อนุมัติ";

    // 2.2 กรองตามคำค้นหา (ชื่อ หรือ รหัสนักศึกษา)
    const lowerQuery = searchQuery.toLowerCase();
    const isSearchMatch =
      req.name.toLowerCase().includes(lowerQuery) || req.studentId.includes(lowerQuery);

    return isStatusMatch && isSearchMatch;
  });

  return (
    <div className="w-full">
      <PendingFilter
        currentFilter={filter}
        onFilterChange={setFilter}
        searchQuery={searchQuery} // 3. ส่งค่า state เข้าไป
        onSearchChange={setSearchQuery} // 4. ส่งฟังก์ชันอัปเดตค่าเข้าไป
      />

      {/* @ts-ignore */}
      <RequestsCard requests={filteredRequests} />
    </div>
  );
}
