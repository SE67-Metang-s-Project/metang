// components/shared/disburse-debt/SharedDisburseDebtList.tsx
"use client";

import React, { useState } from "react";
import DisburseDebtCard from "./DisburseDebtCard";
import StudentFilters from "@/components/shared/filter/StudentFilters";
// import { mockAdminRequests } from "@/components/shared/mock-data/mockAdminRequests";
import { mockDisburseRequests } from "@/components/shared/mock-data/mockDisburseRequests";

interface SharedDisburseDebtListProps {
  userRole: "admin" | "super_admin";
}

export default function SharedDisburseDebtList({ userRole }: SharedDisburseDebtListProps) {
  const [requests] = useState(mockDisburseRequests);

  // State สำหรับตัวกรอง
  const [activeTab, setActiveTab] = useState("ทั้งหมด");
  const filterTabs = ["ทั้งหมด", "รอโอนเงิน", "โอนแล้ว"];

  const [searchQuery, setSearchQuery] = useState("");
  const [degreeFilter, setDegreeFilter] = useState("ทั้งหมด");

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

  return (
    <div className="w-full">
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

      {/* เรียกใช้งาน Card พร้อมส่งข้อมูลที่ถูกกรองแล้ว */}
      <DisburseDebtCard requests={filteredRequests as any} />
    </div>
  );
}
