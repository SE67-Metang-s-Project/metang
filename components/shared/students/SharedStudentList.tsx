// components/shared/students/SharedStudentList.tsx
"use client";

import React, { useState } from "react";
import StudentFilters from "@/components/shared/filter/StudentFilters";
import { useServerPagedList } from "@/hooks/useServerPagedList";
import PagedListError from "@/components/shared/PagedListError";
import StudentListTable, { Student } from "./StudentListItem";
import StudentPaymentHistoryModal from "./StudentPaymentHistoryModal";
import type { ActionRequest } from "@/components/shared/pending/RequestsCard";

const defaultFilterTabs = ["ทั้งหมด", "มีคำร้องดำเนินการ", "มีหนี้คงเหลือ", "ชำระครบ", "เคยชำระล่าช้า"];

// EXPERIMENT server-paging (revert: EXPERIMENT-server-paging.local.md)
const STUDENT_TAB_PARAM: Record<string, string> = { "ชำระตรงเวลา": "on_time", "เคยชำระล่าช้า": "late" };

interface SharedStudentListProps {
  rawRequests: ActionRequest[];
  filterTabs?: string[];
  // With this set, `rawRequests` is page 1 (tab, search and degree unset) and the rest is fetched.
  serverStudents?: { endpoint: string; initialTotal: number };
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
  rawRequests: initialRequests,
  filterTabs = defaultFilterTabs,
  serverStudents,
}: SharedStudentListProps) {
  const [activeTab, setActiveTabState] = useState("ทั้งหมด");
  const [searchQuery, setSearchQueryState] = useState("");
  const [degreeFilter, setDegreeFilterState] = useState("ทั้งหมด");
  const [page, setPage] = useState(1);
  const setActiveTab = (next: string) => {
    setActiveTabState(next);
    setPage(1);
  };
  const setSearchQuery = (next: string) => {
    setSearchQueryState(next);
    setPage(1);
  };
  const setDegreeFilter = (next: string) => {
    setDegreeFilterState(next);
    setPage(1);
  };

  const degree = degreeFilter === "ทั้งหมด" ? "" : degreeFilter;
  const paged = useServerPagedList<ActionRequest>({
    endpoint: serverStudents?.endpoint ?? "",
    params: {
      tab: STUDENT_TAB_PARAM[activeTab] ?? "all",
      q: searchQuery,
      degree,
      page,
      limit: 5,
    },
    atInitialView: !serverStudents || (activeTab === "ทั้งหมด" && !searchQuery && !degree && page === 1),
    initialItems: initialRequests,
    initialTotal: serverStudents?.initialTotal ?? 0,

    onPageOverflow: setPage,
  });
  const rawRequests = serverStudents ? paged.items : initialRequests;
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
    if (serverStudents) return true; // the server already filtered
    const matchesSearch =
      student.name.includes(searchQuery) || student.studentId.includes(searchQuery);

    let matchesDegree = true;
    if (degreeFilter !== "ทั้งหมด") {
      const degreeCode = student.studentId.charAt(4);
      if (degreeFilter === "ประกาศนียบัตรผู้ช่วยพยาบาล") matchesDegree = degreeCode === "0";
      else if (degreeFilter === "ปริญญาตรี") matchesDegree = degreeCode === "1";
      else if (degreeFilter === "ปริญญาโท") matchesDegree = degreeCode === "3";
      else if (degreeFilter === "ปริญญาเอก") matchesDegree = degreeCode === "5";
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
        <PagedListError failed={paged.failed} />
        <div className={paged.loading ? "opacity-50 transition-opacity" : undefined} aria-busy={paged.loading}>
          <StudentListTable
            onStudentSelect={setSelectedStudent}
            students={filteredStudents}
            serverPaging={
              serverStudents ? { page, total: paged.total, pageSize: 5, onPageChange: setPage } : undefined
            }
          />
        </div>
      </div>
      </div>

      {selectedStudent ? (
        <StudentPaymentHistoryModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      ) : null}
    </>
  );
}
