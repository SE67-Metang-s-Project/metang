// components/shared/students/SharedStudentList.tsx
"use client";

import React, { useState } from "react";
import StudentFilters from "@/components/shared/filter/StudentFilters";
import StudentListTable, { Student } from "./StudentListItem"; // ตรวจสอบ path ให้ตรงกับไฟล์ของคุณ

const filterTabs = ["ทั้งหมด", "มีคำร้องดำเนินการ", "มีหนี้คงเหลือ", "ชำระครบ", "เคยชำระล่าช้า"];

interface SharedStudentListProps {
  // รับข้อมูลคำร้อง/นักศึกษาเข้ามาจากหน้า Page
  rawRequests: any[];
}

export default function SharedStudentList({ rawRequests }: SharedStudentListProps) {
  const [activeTab, setActiveTab] = useState("ทั้งหมด");
  const [searchQuery, setSearchQuery] = useState("");
  const [degreeFilter, setDegreeFilter] = useState("ทั้งหมด");

  // แปลงข้อมูลให้อยู่ในฟอร์แมตที่ StudentListTable ต้องการ
  const mappedStudents: Student[] = rawRequests.map((req) => {
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
      requestStatus: req.requestStatus,
      paymentStatus: paymentStatus,
      paymentStatusType: paymentStatusType,
      totalBorrowed: formattedAmount,
      balance: mockBalance,
      delayDays: req.isOverdue ? String(req.waitDays) : "0",
    };
  });

  // กรองข้อมูล
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
    <div className="space-y-6">
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
  );
}
