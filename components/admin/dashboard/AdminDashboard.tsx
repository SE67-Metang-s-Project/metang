"use client";

import React, { useMemo, useState } from "react";

import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";
import WelcomeCard from "@/components/shared/WelcomeCard";

import AdminRequestsList from "@/components/admin/pending/AdminRequestsList";
import DisburseDebtCard from "@/components/admin/disburse-debt/DisburseDebtCard";
import VerifySlipCard from "@/components/admin/verify-slip/VerifySlipCard";

import { mockAdminRequests } from "@/components/shared/mock-data/mockAdminRequests";

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [requests] = useState(mockAdminRequests);

  // =====================================================
  // 1. คำร้องที่รอ Admin พิจารณา
  // =====================================================
  const pendingRequests = useMemo(() => {
    return requests.filter(
      (req) => req.requestStatus === "pending_admin"
    );
  }, [requests]);

  // =====================================================
  // 2. รายการที่ผู้บริหารอนุมัติแล้ว และรอ Admin โอนเงิน
  // =====================================================
  const disbursementRequests = useMemo(() => {
    return requests.filter(
      (req) => req.requestStatus === "pending_disbursement"
    );
  }, [requests]);

  // =====================================================
  // 3. รายการที่มีสลิป และสลิปนั้นยังรอตรวจสอบ
  // =====================================================
  const verifySlipRequests = useMemo(() => {
    return requests.filter((req) => {
      return (
        Array.isArray(req.paymentHistory) &&
        req.paymentHistory.some(
          (payment: any) => payment.status === "pending"
        )
      );
    });
  }, [requests]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">

      {/* =====================================================
          Sidebar
      ===================================================== */}
      <SideNav
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        role="admin"
      />

      {/* =====================================================
          Main Content
      ===================================================== */}
      <div className="flex-1 flex flex-col w-full min-h-screen min-[1576px]:ml-64">

        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="แอดมินคนหล่อ"
          userId="Admin001"
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">

          {/* =====================================================
              Welcome
          ===================================================== */}
          <WelcomeCard
            name="แอดมินคนหล่อ"
            description="admin"
          />

          {/* =====================================================
              Summary Cards
          ===================================================== */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6 mb-8">

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

          </section>

          {/* =====================================================
              1. Pending Review
          ===================================================== */}
          <section className="mb-10">

            <SectionHeader
              title="คำร้องรอพิจารณา"
              description="รายการคำร้องที่ต้องตรวจสอบและดำเนินการ"
              href="/admin/pending"
            />

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

              <AdminRequestsList
                hideFilters
                dashboardMode="pending"
              />

            </div>

          </section>

          {/* =====================================================
              2. Disbursement
          ===================================================== */}
          <section className="mb-10">

            <SectionHeader
              title="รายการเบิกจ่าย"
              description="รายการที่ผ่านการอนุมัติจากผู้บริหารและรอการโอนเงิน"
              href="/admin/disburse-debt"
            />

            {disbursementRequests.length > 0 ? (
              <DisburseDebtCard
                requests={disbursementRequests as any}
              />
            ) : (
              <EmptyState
                icon="💸"
                title="ไม่มีรายการรอโอนเงิน"
                description="ขณะนี้ยังไม่มีรายการที่รอการเบิกจ่าย"
              />
            )}

          </section>

          {/* =====================================================
              3. Verify Slip
          ===================================================== */}
          <section className="mb-10">

            <SectionHeader
              title="ตรวจสอบสลิปชำระเงิน"
              description="หลักฐานการโอนเงินที่นักศึกษาแนบเข้ามาและรอตรวจสอบ"
              href="/admin/verify-slip"
            />

            {verifySlipRequests.length > 0 ? (
              <VerifySlipCard
                requests={verifySlipRequests as any}
                userRole="admin"
              />
            ) : (
              <EmptyState
                icon="🧾"
                title="ไม่มีสลิปที่รอตรวจสอบ"
                description="ขณะนี้ยังไม่มีหลักฐานการโอนเงินที่รอตรวจสอบ"
              />
            )}

          </section>

        </main>
      </div>
    </div>
  );
}


/* =====================================================
   Dashboard Stat Card
===================================================== */

function DashboardStatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm text-gray-500 mb-2">
            {title}
          </p>

          <p className="text-3xl font-bold text-[#1e293b]">
            {value}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            {description}
          </p>
        </div>

        <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-xl">
          {icon}
        </div>

      </div>
    </div>
  );
}


/* =====================================================
   Section Header
===================================================== */

function SectionHeader({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className="flex items-end justify-between mb-4">

      <div>
        <h2 className="text-lg font-bold text-[#1e293b]">
          {title}
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          {description}
        </p>
      </div>

      <a
        href={href}
        className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
      >
        ดูทั้งหมด →
      </a>

    </div>
  );
}


/* =====================================================
   Empty State
===================================================== */

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">

      <div className="text-4xl mb-3">
        {icon}
      </div>

      <h3 className="text-base font-semibold text-gray-700">
        {title}
      </h3>

      <p className="text-sm text-gray-400 mt-1">
        {description}
      </p>

    </div>
  );
}
