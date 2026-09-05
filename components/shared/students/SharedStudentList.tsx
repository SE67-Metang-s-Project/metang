// components/shared/students/SharedStudentList.tsx
"use client";

import React, { useState } from "react";
import StudentFilters from "@/components/shared/filter/StudentFilters";
import StudentListTable, { Student } from "./StudentListItem";

const filterTabs = ["ทั้งหมด", "มีคำร้องดำเนินการ", "มีหนี้คงเหลือ", "ชำระครบ", "เคยชำระล่าช้า"];

interface SharedStudentListProps {
  rawRequests: any[];
}

// ----------------------------------------------------
// ฟังก์ชันแปลงสถานะดิบ (Raw Status) ให้เป็นข้อความภาษาไทยและสี
// ----------------------------------------------------
const getTranslateStatus = (status: string) => {
  const s = String(status).toLowerCase();
  if (s.includes("pending") || s === "draft") {
    return { label: "มีคำร้องรอดำเนินการ", colorTheme: "blue" as const };
  }
  if (s === "disbursed") {
    return { label: "อยู่ระหว่างผ่อนชำระ", colorTheme: "orange" as const };
  }
  if (s === "closed") {
    return { label: "ปิดยอดแล้ว", colorTheme: "green" as const };
  }
  if (s.includes("reject") || s.includes("cancel") || s.includes("return")) {
    return { label: "คำร้องถูกยกเลิก/ส่งกลับ", colorTheme: "gray" as const };
  }
  return { label: "สถานะไม่ระบุ", colorTheme: "gray" as const };
};

export default function SharedStudentList({ rawRequests }: SharedStudentListProps) {
  const [activeTab, setActiveTab] = useState("ทั้งหมด");
  const [searchQuery, setSearchQuery] = useState("");
  const [degreeFilter, setDegreeFilter] = useState("ทั้งหมด");

  const mappedStudents: Student[] = rawRequests.map((req) => {
    const isLate = (req.paymentBehavior?.lateInstallments ?? 0) > 0;
    const paymentStatus = isLate ? "ชำระล่าช้า" : "ชำระตรงเวลา";
    const paymentStatusType = isLate ? "bad" : "good";

    const formattedAmount = Number(req.amount).toLocaleString();
    const mockBalance =
      req.requestStatus === "disbursed" || req.requestStatus === "closed" ? formattedAmount : "0";

    // ดึงค่า label และสีจากฟังก์ชันที่เราสร้างไว้
    const { label: requestLabel, colorTheme: requestColor } = getTranslateStatus(req.requestStatus);

    return {
      initial: req.name.charAt(0),
      name: req.name,
      studentId: req.studentId,
      major: req.major,
      year: req.year,
      rawStatus: req.requestStatus, // เก็บสถานะดิบไว้ใช้ทำ Filter ด้านล่าง
      requestStatusLabel: requestLabel, // ข้อความที่จะโชว์ใน UI
      requestStatusColor: requestColor, // สีที่จะโชว์ใน UI
      paymentStatus: paymentStatus,
      paymentStatusType: paymentStatusType,
      totalBorrowed: formattedAmount,
      balance: mockBalance,
      delayDays: req.isOverdue ? String(req.waitDays) : "0",
    };
  });

  const filteredStudents = mappedStudents.filter((student) => {
    const matchesSearch =
      student.name.includes(searchQuery) || student.studentId.includes(searchQuery);

    let matchesDegree = true;
    if (degreeFilter !== "ทั้งหมด") {
      const degreeCode = student.studentId.charAt(4);
      if (degreeFilter === "ประกาศนียบัตรผู้ช่วยพยาบาล") matchesDegree = degreeCode === "0";
      else if (degreeFilter === "ป.ตรี") matchesDegree = degreeCode === "1";
      else if (degreeFilter === "ป.โท") matchesDegree = degreeCode === "3";
      else if (degreeFilter === "ป.เอก") matchesDegree = degreeCode === "5";
    }

    let matchesTab = true;
    if (activeTab === "มีคำร้องดำเนินการ") {
      matchesTab = student.rawStatus.includes("pending");
    } else if (activeTab === "เคยชำระล่าช้า") {
      matchesTab = student.paymentStatusType === "bad";
    } else if (activeTab === "มีหนี้คงเหลือ") {
      matchesTab = Number(student.balance.replace(/,/g, "")) > 0;
    } else if (activeTab === "ชำระครบ") {
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
