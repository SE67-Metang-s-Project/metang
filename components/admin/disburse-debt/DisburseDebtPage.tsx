"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";
import DisburseDebtCard from "@/components/admin/disburse-debt/DisburseDebtCard";
import StudentFilters from "@/components/shared/filter/StudentFilters";
import { mockAdminRequests } from "@/components/shared/mock-data/mockAdminRequests";

export default function DisburseDebtPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [requests] = useState(mockAdminRequests);

  // ==========================================
  // 1. State สำหรับตัวกรอง (แก้ไขชื่อให้ตรงกับ StudentFiltersProps)
  // ==========================================
  const [activeTab, setActiveTab] = useState("ทั้งหมด");
  const filterTabs = ["ทั้งหมด", "รอโอนเงิน", "โอนแล้ว"]; // แท็บสถานะ

  const [searchQuery, setSearchQuery] = useState("");
  const [degreeFilter, setDegreeFilter] = useState("ทั้งหมด");

  // ==========================================
  // 2. Logic ในการกรองข้อมูล
  // ==========================================
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
      matchTab = req.requestStatus === "disbursed";
    }

    // Degree
    const matchDegree = degreeFilter === "ทั้งหมด" || req.major.includes(degreeFilter);

    return matchSearch && matchTab && matchDegree;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      {/* Sidebar Navigation */}
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="admin" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full min-h-screen lg:ml-64 transition-all duration-300">
        {/* Top Navigation */}
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="แอดมิน สมปอง"
          userId="T1002"
        />

        <main className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] mb-1">
              เบิกจ่ายเงินให้นักศึกษา (Disbursement)
            </h1>
            <p className="text-[13px] text-gray-500">
              รายการคำร้องที่ผ่านการอนุมัติจากผู้บริหารแล้ว
              กรุณาโอนเงินและแนบสลิปเพื่อยืนยันการเบิกจ่าย
            </p>
          </div>

          {/* ========================================== */}
          {/* ส่วนตัวกรอง (StudentFilters) ส่ง Props ให้ครบ */}
          {/* ========================================== */}
          <div className="mb-6">
            <StudentFilters
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              filterTabs={filterTabs}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              degreeFilter={degreeFilter}
              setDegreeFilter={setDegreeFilter}
            />
          </div>

          {/* รายการคำร้อง */}
          <DisburseDebtCard requests={filteredRequests as any} />
        </main>
      </div>
    </div>
  );
}
