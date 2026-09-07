"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import WelcomeCard from "@/components/shared/WelcomeCard";
import RequestsCard, { ActionRequest } from "@/components/shared/pending/RequestsCard";
import StudentListTable, { Student } from "@/components/shared/students/StudentListItem";
import {
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

interface AdvisorDashboardProps {
  userName?: string;
  userId?: string;
  initialRequests?: ActionRequest[];
}

// ----------------------------------------------------
// 1. เพิ่มฟังก์ชันแปลงสถานะให้ตรงกับที่ตารางต้องการ
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

export default function AdvisorDashboard({
  userName = "อาจารย์ที่ปรึกษา",
  initialRequests = [],
}: AdvisorDashboardProps) {
  const [requests, setRequests] = useState<ActionRequest[]>(initialRequests);
  const [prevInitialRequests, setPrevInitialRequests] = useState<ActionRequest[]>(initialRequests);

  if (initialRequests !== prevInitialRequests) {
    setPrevInitialRequests(initialRequests);
    setRequests(initialRequests);
  }

  const handleRequestDecided = (requestId: string, decision: string) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              requestStatus:
                decision === "approved"
                  ? "pending_admin"
                  : decision === "returned"
                    ? "returned"
                    : "rejected",
            }
          : req,
      ),
    );
  };

  // คำร้องรออาจารย์ที่ปรึกษาพิจารณา
  const pendingRequests = useMemo(
    () => requests.filter((req) => req.requestStatus === "pending_advisor"),
    [requests],
  );

  // แปลงรายการคำร้องเป็นรายชื่อนักศึกษาในความดูแล (ไม่ซ้ำ)
  const studentsList: Student[] = useMemo(() => {
    const seen = new Set<string>();
    const uniqueReqs: ActionRequest[] = [];

    for (const req of requests) {
      if (!seen.has(req.studentId)) {
        seen.add(req.studentId);
        uniqueReqs.push(req);
      }
    }

    return uniqueReqs.map((req) => {
      const isLate = (req.paymentBehavior?.lateInstallments ?? 0) > 0;
      const paymentStatus = isLate ? "ชำระล่าช้า" : "ชำระตรงเวลา";
      const paymentStatusType: "good" | "bad" = isLate ? "bad" : "good";
      const formattedAmount = Number(req.amount).toLocaleString();
      const mockBalance =
        req.requestStatus === "disbursed" || req.requestStatus === "closed" ? formattedAmount : "0";

      // 2. เรียกใช้ฟังก์ชันแปลสถานะ
      const { label: requestLabel, colorTheme: requestColor } = getTranslateStatus(
        req.requestStatus,
      );

      return {
        initial: req.name.charAt(0),
        name: req.name,
        studentId: req.studentId,
        major: req.major,
        year: req.year,
        rawStatus: req.requestStatus, // <--- ส่งให้ครบตาม Type ใหม่
        requestStatusLabel: requestLabel, // <--- ส่งข้อความไทย
        requestStatusColor: requestColor, // <--- ส่งสี
        paymentStatus,
        paymentStatusType,
        totalBorrowed: formattedAmount,
        balance: mockBalance,
        delayDays: req.isOverdue ? String(req.waitDays ?? 0) : "0",
      };
    });
  }, [requests]);

  return (
    <div className="space-y-8">
      {/* การ์ดต้อนรับ */}
      <WelcomeCard
        name={userName}
        description="อาจารย์ที่ปรึกษา คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่"
      />

      {/* ส่วนที่ 1: รายการคำร้องรอพิจารณา (ล่าสุด) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              คำร้องรอพิจารณา (ในฐานะอาจารย์ที่ปรึกษา)
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              รายการคำขอขอกู้ยืมจากนักศึกษาที่อยู่ในความดูแลของท่าน
              ซึ่งรอการพิจารณาและอนุมัติจากอาจารย์ที่ปรึกษา
            </p>
          </div>

          <Link
            href="/advisor/pending"
            className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
          >
            <span>ดูคำร้องทั้งหมด</span>
            <ChevronRight size={16} />
          </Link>
        </div>

        {pendingRequests.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <RequestsCard
              requests={pendingRequests}
              userRole="advisor"
              onRequestDecided={handleRequestDecided}
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck size={24} />
            </div>
            <h3 className="font-semibold text-gray-800 text-base mb-1">
              ไม่มีคำร้องรอพิจารณาในขณะนี้
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              ท่านได้พิจารณาคำร้องของนักศึกษาในความดูแลครบถ้วนแล้ว
              หากมีคำร้องใหม่จากนักศึกษาจะปรากฏในส่วนนี้ทันที
            </p>
          </div>
        )}
      </section>

      {/* ส่วนที่ 2: นักศึกษาในความดูแลล่าสุด */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">นักศึกษาในความดูแล</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              รายชื่อและประวัติการกู้ยืมของนักศึกษาภายใต้การดูแล
            </p>
          </div>
          <Link
            href="/advisor/students"
            className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
          >
            <span>ดูรายชื่อทั้งหมด</span>
            <ChevronRight size={16} />
          </Link>
        </div>

        <StudentListTable students={studentsList.slice(0, 5)} />
      </section>
    </div>
  );
}

