"use client";

import React, { useState, useMemo, useEffect } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";
import RequestsCard, { ActionRequest } from "@/components/shared/pending/RequestsCard";
import { ShieldCheck } from "lucide-react";

type AdvisorPendingPageProps = {
  userName?: string;
  userId?: string;
  initialRequests?: ActionRequest[];
};

export default function AdvisorPendingPage({
  userName = "อาจารย์ที่ปรึกษา",
  userId = "Advisor",
  initialRequests = [],
}: AdvisorPendingPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // กำหนด State ให้กับ requests จาก DB
  const [requests, setRequests] = useState<ActionRequest[]>(initialRequests);

  useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests]);

  const handleRequestDecided = (requestId: string) => {
    setRequests((prev) => prev.filter((req) => req.id !== requestId));
  };

  // กรองเฉพาะคำร้องที่รออาจารย์ที่ปรึกษาพิจารณา
  const pendingRequests = useMemo(
    () => requests.filter((req) => req.requestStatus === "pending_advisor"),
    [requests],
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      {/* Sidebar Navigation */}
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="advisor" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full min-h-screen min-[1576px]:ml-64 transition-all duration-300">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName={userName}
          userId={userId}
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              คำร้องรอพิจารณา (ในฐานะอาจารย์ที่ปรึกษา)
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              รายการคำขอขอกู้ยืมจากนักศึกษาที่อยู่ในความดูแลของท่าน
              ซึ่งรอการพิจารณาและอนุมัติจากอาจารย์ที่ปรึกษา
            </p>
          </div>

          {/* แสดงรายการคำร้อง หรือ ข้อความเมื่อไม่มีคำร้อง */}
          {pendingRequests.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <RequestsCard
                requests={pendingRequests}
                userRole="advisor"
                onRequestDecided={handleRequestDecided}
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center mt-4">
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
        </main>
      </div>
    </div>
  );
}
