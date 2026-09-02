"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";

import StudentFilters from "./StudentFilters"; 
import StudentListTable, { Student } from "./StudentListItem"; 

// นำเข้าข้อมูล Mock Data ที่คุณสร้างไว้
import { mockAdvisorRequests } from "@/components/shared/mockAdvisorRequests"; 

// ตั้งค่า Tabs โดยลบ "ไม่มีคำร้อง" ออก
const filterTabs = [
  "ทั้งหมด",
  "มีคำร้องดำเนินการ",
  "มีหนี้คงเหลือ",
  "ชำระครบ",
  "เคยชำระล่าช้า",
];

export default function StudentList() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ทั้งหมด");
  const [searchQuery, setSearchQuery] = useState("");
  const [degreeFilter, setDegreeFilter] = useState("ทั้งหมด");

  // แปลง ActionRequest ให้เป็น Student Type เพื่อแสดงในตาราง
  const mappedStudents: Student[] = mockAdvisorRequests.map((req) => {
    // กำหนดเงื่อนไข: พฤติกรรมการชำระเงิน มีแค่ ชำระตรงเวลา และ ชำระล่าช้า (แดง/เขียว)
    const isLate = (req.paymentBehavior?.lateInstallments ?? 0) > 0;
    const paymentStatus = isLate ? "ชำระล่าช้า" : "ชำระตรงเวลา";
    const paymentStatusType = isLate ? "bad" : "good";
    
    // แปลงยอดกู้เป็นตัวเลขเพื่อใส่ลูกน้ำ (,)
    const formattedAmount = Number(req.amount).toLocaleString();
    
    // (จำลองข้อมูล Balance) สมมติว่ายอดคงเหลือก็คือยอดที่กู้
    const mockBalance = req.requestStatus === "อนุมัติแล้ว" ? formattedAmount : "0"; 

    return {
      initial: req.name.charAt(0),
      name: req.name,
      studentId: req.studentId,
      major: req.major,
      year: req.year,
      requestStatus: req.requestStatus,
      paymentStatus: paymentStatus,
      paymentStatusType: paymentStatusType,
      totalBorrowed: formattedAmount,
      balance: mockBalance,
      delayDays: req.isOverdue ? req.waitDays.toString() : "0",
    };
  });

  // ใช้ฟังก์ชัน Filter ข้อมูลก่อนส่งไปแสดงผล
  const filteredStudents = mappedStudents.filter((student) => {
    // 1. กรองด้วยช่องค้นหา (ชื่อ หรือ รหัสนักศึกษา)
    const matchesSearch = student.name.includes(searchQuery) || student.studentId.includes(searchQuery);

    // 2. กรองด้วยระดับการศึกษา (อิงคำจาก Major)
    let matchesDegree = true;
    if (degreeFilter !== "ทั้งหมด") {
      if (degreeFilter === "ป.ตรี") matchesDegree = student.major.includes("บัณฑิต");
      else if (degreeFilter === "ป.โท") matchesDegree = student.major.includes("มหาบัณฑิต");
      else if (degreeFilter === "ป.เอก") matchesDegree = student.major.includes("ดุษฎีบัณฑิต");
      else if (degreeFilter === "ประกาศนียบัตรผู้ช่วยพยาบาล") matchesDegree = student.major.includes("ผู้ช่วยพยาบาล");
    }

    // 3. กรองด้วย Tabs
    let matchesTab = true;
    if (activeTab === "มีคำร้องดำเนินการ") {
      matchesTab = student.requestStatus === "รอพิจารณา" || student.requestStatus.includes("รอ");
    } else if (activeTab === "เคยชำระล่าช้า") {
      matchesTab = student.paymentStatusType === "bad";
    } else if (activeTab === "มีหนี้คงเหลือ") {
      // เอาคอมม่าออกแล้วเช็คว่า > 0 หรือไม่
      matchesTab = Number(student.balance.replace(/,/g, "")) > 0; 
    } else if (activeTab === "ชำระครบ") {
      matchesTab = Number(student.balance.replace(/,/g, "")) === 0;
    }

    return matchesSearch && matchesDegree && matchesTab;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      {/* SideNav */}
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="advisor" />

      <main className="flex-1 flex flex-col w-full min-h-screen lg:ml-64 transition-all duration-300">
        
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="ผศ.ดร. สุนีย์ วงค์ประเสริฐ"
          userId="T1002"
        />

        <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] w-full mx-auto space-y-6">
          
          {/* Header Title ของหน้า */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] mb-1">นักศึกษาในความดูแล</h1>
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