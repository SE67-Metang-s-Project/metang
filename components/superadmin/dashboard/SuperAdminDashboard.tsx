"use client";

import React, { useMemo, useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";
import WelcomeCard from "@/components/shared/WelcomeCard";

import { mockAdminRequests } from "@/components/shared/mock-data/mockAdminRequests";
import FinancialOverview from "@/components/shared/financial/FinancialOverview";
// 1. นำเข้า SharedRequestsList แทนที่ SuperAdminRequestsList
import SharedRequestsList from "@/components/shared/pending/SharedRequestsList";
import { UserCog } from "lucide-react";

export default function SuperAdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [requests] = useState(mockAdminRequests);

  const pendingRequests = useMemo(
    () => requests.filter((req) => req.requestStatus === "pending_admin"),
    [requests],
  );
  const disbursementRequests = useMemo(
    () => requests.filter((req) => req.requestStatus === "pending_disbursement"),
    [requests],
  );
  const verifySlipRequests = useMemo(
    () =>
      requests.filter(
        (req) =>
          Array.isArray(req.paymentHistory) &&
          req.paymentHistory.some((payment: any) => payment.status === "pending"),
      ),
    [requests],
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="superadmin" />

      <div className="flex-1 flex flex-col w-full min-h-screen lg:ml-64">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="Super Admin สูงสุด"
          userId="SA-001"
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <WelcomeCard
            name="Super Admin สูงสุด"
            description="ผู้ดูแลระบบระดับสูง (Super Administrator)"
          />

          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mt-6 mb-8">
            <DashboardStatCard
              title="คำร้องรอพิจารณา"
              value={pendingRequests.length}
              description="รายการที่ต้องตรวจสอบ"
              icon="📋"
            />
            <DashboardStatCard
              title="รอโอนเงิน"
              value={disbursementRequests.length}
              description="รายการที่พร้อมเบิกจ่าย"
              icon="💸"
            />
            <DashboardStatCard
              title="รอตรวจสอบสลิป"
              value={verifySlipRequests.length}
              description="หลักฐานที่รอตรวจสอบ"
              icon="🧾"
            />
            <DashboardStatCard
              title="คำร้องทั้งหมด"
              value={requests.length}
              description="รายการในระบบ"
              icon="📊"
            />

            <div className="bg-white rounded-2xl border border-orange-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-orange-50 rounded-full z-0"></div>
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-2">ผู้ใช้งานในระบบ</p>
                  <p className="text-3xl font-bold text-[#1e293b]">1,284</p>
                  <a
                    href="/superadmin/users"
                    className="text-xs text-orange-600 hover:text-orange-700 mt-2 inline-flex font-bold"
                  >
                    จัดการสิทธิ์ผู้ใช้งาน →
                  </a>
                </div>
                <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                  <UserCog size={20} />
                </div>
              </div>
            </div>
          </section>

          <div className="mb-10">
            <FinancialOverview apiUrl="/api/superadmin/financial-overview" />
          </div>

          <section className="mb-10">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#1e293b]">คำร้องรอพิจารณา (ภาพรวม)</h2>
                <p className="text-sm text-gray-500 mt-1">รายการคำร้องที่สามารถปรับแก้วงเงินได้</p>
              </div>
              <a
                href="/superadmin/pending"
                className="text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                ดูทั้งหมด →
              </a>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* 2. เปลี่ยนมาใช้ SharedRequestsList และส่ง userRole="super_admin" เข้าไป */}
              <SharedRequestsList userRole="super_admin" hideFilters dashboardMode="pending" />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function DashboardStatCard({ title, value, description, icon }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-2">{title}</p>
          <p className="text-3xl font-bold text-[#1e293b]">{value}</p>
          <p className="text-xs text-gray-400 mt-2">{description}</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center text-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}
