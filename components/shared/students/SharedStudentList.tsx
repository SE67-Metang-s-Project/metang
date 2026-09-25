// components/shared/students/SharedStudentList.tsx
"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import StudentFilters from "@/components/shared/filter/StudentFilters";
import StudentListTable, { Student } from "./StudentListItem";
import PaymentEvidenceHistory from "./PaymentEvidenceHistory";
import type { ActionRequest } from "@/components/shared/pending/RequestsCard";

const defaultFilterTabs = ["ทั้งหมด", "มีคำร้องดำเนินการ", "มีหนี้คงเหลือ", "ชำระครบ", "เคยชำระล่าช้า"];

interface SharedStudentListProps {
  rawRequests: ActionRequest[];
  filterTabs?: string[];
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

export default function SharedStudentList({
  rawRequests,
  filterTabs = defaultFilterTabs,
}: SharedStudentListProps) {
  const [activeTab, setActiveTab] = useState("ทั้งหมด");
  const [searchQuery, setSearchQuery] = useState("");
  const [degreeFilter, setDegreeFilter] = useState("ทั้งหมด");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const mappedStudents: Student[] = rawRequests.map((req) => {
    const isLate = (req.paymentBehavior?.lateInstallments ?? 0) > 0;
    const paymentStatus = isLate ? "ชำระล่าช้า" : "ชำระตรงเวลา";
    const paymentStatusType = isLate ? "bad" : "good";

    const totalDue =
      req.installments && req.installments.length > 0
        ? req.installments.reduce((sum, inst) => sum + Number(inst.amount || 0), 0)
        : Number(req.approvedAmount ?? req.amount ?? 0);
    const totalPaid =
      req.installments && req.installments.length > 0
        ? req.installments.reduce((sum, inst) => sum + Number(inst.paidAmount || 0), 0)
        : 0;
    const remainingBalance =
      req.requestStatus === "closed"
        ? 0
        : req.requestStatus === "disbursed"
          ? Math.max(0, totalDue - totalPaid)
          : 0;

    const formattedAmount = totalDue.toLocaleString();
    const balance = remainingBalance.toLocaleString();

    // ดึงค่า label และสีจากฟังก์ชันที่เราสร้างไว้
    const { label: requestLabel, colorTheme: requestColor } = getTranslateStatus(req.requestStatus);

    return {
      initial: req.name.charAt(0),
      name: req.name,
      studentId: req.studentId,
      major: req.major,
      degree: req.degree || "-",
      year: req.year,
      rawStatus: req.requestStatus, // เก็บสถานะดิบไว้ใช้ทำ Filter ด้านล่าง
      requestStatusLabel: requestLabel, // ข้อความที่จะโชว์ใน UI
      requestStatusColor: requestColor, // สีที่จะโชว์ใน UI
      paymentStatus: paymentStatus,
      paymentStatusType: paymentStatusType,
      totalBorrowed: formattedAmount,
      balance: balance,
      delayDays: req.isOverdue ? String(req.waitDays) : "0",
      paymentHistory: req.paymentHistory,
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
    } else if (activeTab === "ชำระตรงเวลา") {
      matchesTab = student.paymentStatusType === "good";
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
    <>
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
        <StudentListTable onStudentSelect={setSelectedStudent} students={filteredStudents} />
      </div>
      </div>

      {selectedStudent && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedStudent(null)}
          role="dialog"
        >
          <section
            aria-labelledby="student-detail-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-gray-50 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 bg-white px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900" id="student-detail-title">{selectedStudent.name}</h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  {selectedStudent.studentId} · {selectedStudent.major} · ชั้นปี {selectedStudent.year}
                </p>
              </div>
              <button
                aria-label="ปิดรายละเอียดนักศึกษา"
                className="rounded-full bg-gray-50 p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                onClick={() => setSelectedStudent(null)}
                type="button"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </header>
            <div className="space-y-4 p-4 sm:p-6">
              <PaymentEvidenceHistory payments={selectedStudent.paymentHistory} />
            </div>
          </section>
        </div>
      )}
    </>
  );
}
