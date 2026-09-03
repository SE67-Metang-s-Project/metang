"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";

import StudentFilters from "./StudentFilters";
import StudentListTable, { Student } from "./StudentListItem";

// นำเข้าข้อมูล Mock Data
import { mockAdvisorRequests } from "@/components/shared/mock-data/mockAdvisorRequests";

// ตั้งค่า Tabs
const filterTabs = ["ทั้งหมด", "มีคำร้องดำเนินการ", "มีหนี้คงเหลือ", "ชำระครบ", "เคยชำระล่าช้า"];

export default function StudentList() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ทั้งหมด");
  const [searchQuery, setSearchQuery] = useState("");
  const [degreeFilter, setDegreeFilter] = useState("ทั้งหมด");

  const mappedStudents: Student[] = mockAdvisorRequests.map((req) => {
    const isLate = (req.paymentBehavior?.lateInstallments ?? 0) > 0;
    const paymentStatus = isLate ? "ชำระล่าช้า" : "ชำระตรงเวลา";
    const paymentStatusType = isLate ? "bad" : "good";

    const formattedAmount = Number(req.amount).toLocaleString();

    // จำลองยอดคงเหลือ
    const mockBalance =
      req.requestStatus === "disbursed" || req.requestStatus === "closed" ? formattedAmount : "0";

    return {
      initial: req.name.charAt(0),
      name: req.name,
      studentId: req.studentId,
      major: req.major,
      year: req.year,
      requestStatus: req.requestStatus, // ปล่อยให้แสดงเป็น string status ไปก่อน (ถ้าอยากให้เป็นป้ายสี ต้องแปลงกลับเป็นไทยแบบใน RequestCard)
      paymentStatus: paymentStatus,
      paymentStatusType: paymentStatusType,
      totalBorrowed: formattedAmount,
      balance: mockBalance,
      delayDays: req.isOverdue ? String(req.waitDays) : "0",
    };
  });

  const filteredStudents = mappedStudents.filter((student) => {
    // 1. กรองด้วยช่องค้นหา
    const matchesSearch =
      student.name.includes(searchQuery) || student.studentId.includes(searchQuery);

    // 2. กรองด้วยระดับการศึกษา (เช็คจากรหัสนักศึกษา หลักที่ 5)
    let matchesDegree = true;
    if (degreeFilter !== "ทั้งหมด") {
      const degreeCode = student.studentId.charAt(4); // หลักที่ 5 คือ index ที่ 4

      if (degreeFilter === "ประกาศนียบัตรผู้ช่วยพยาบาล") {
        matchesDegree = degreeCode === "0";
      } else if (degreeFilter === "ป.ตรี") {
        matchesDegree = degreeCode === "1";
      } else if (degreeFilter === "ป.โท") {
        matchesDegree = degreeCode === "3";
      } else if (degreeFilter === "ป.เอก") {
        matchesDegree = degreeCode === "5";
      }
    }

    // 3. กรองด้วย Tabs
    let matchesTab = true;
    if (activeTab === "มีคำร้องดำเนินการ") {
      matchesTab = student.requestStatus.includes("pending");
    } else if (activeTab === "เคยชำระล่าช้า") {
      matchesTab = student.paymentStatusType === "bad";
    } else if (activeTab === "มีหนี้คงเหลือ") {
      matchesTab = Number(student.balance.replace(/,/g, "")) > 0;
    } else if (activeTab === "ชำระครบ") {
      // ถ้ายอดกู้ > 0 และ ยอดคงเหลือ = 0 แปลว่าชำระครบ
      const total = Number(student.totalBorrowed.replace(/,/g, ""));
      const balance = Number(student.balance.replace(/,/g, ""));
      matchesTab = total > 0 && balance === 0;
    }

    return matchesSearch && matchesDegree && matchesTab;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="advisor" />

      <main className="flex-1 flex flex-col w-full min-h-screen lg:ml-64 transition-all duration-300">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="ผศ.ดร. สุนีย์ วงค์ประเสริฐ"
          userId="T1002"
        />

        <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] w-full mx-auto space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] mb-1">
              นักศึกษาในความดูแล
            </h1>
            <p className="text-[13px] text-gray-500">รายชื่อนักศึกษาที่อยู่ภายใต้การดูแลของท่าน</p>
          </div>

          <StudentFilters
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            filterTabs={filterTabs}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            degreeFilter={degreeFilter}
            setDegreeFilter={setDegreeFilter}
          />

          <div className="mt-2">
            <StudentListTable students={filteredStudents} />
          </div>
        </div>
      </main>
    </div>
  );
}
