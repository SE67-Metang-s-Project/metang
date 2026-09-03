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

  // ==========================================
  // 1. คำร้องที่รอพิจารณา
  // ==========================================
  const pendingRequests = useMemo(() => {
    return requests.filter((req) => {
      return (
        req.requestStatus !== "approved" &&
        req.requestStatus !== "disbursed" &&
        req.requestStatus !== "rejected"
      );
    });
  }, [requests]);

  // ==========================================
  // 2. รายการที่รอโอนเงิน
  // ==========================================
  const disbursementRequests = useMemo(() => {
    return requests.filter((req) => {
      return req.requestStatus === "approved";
    });
  }, [requests]);

  // ==========================================
  // 3. รายการที่มีประวัติการชำระเงิน
  // ==========================================
  const verifySlipRequests = useMemo(() => {
    return requests.filter((req) => req.paymentHistory && req.paymentHistory.length > 0);
  }, [requests]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      {/* Sidebar */}
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="admin" />

      {/* Main */}
      <div className="flex-1 flex flex-col w-full min-h-screen lg:ml-64">
        {/* Top Navigation */}
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="แอดมินคนหล่อ"
          userId="Admin001"
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {/* ==========================================
              Welcome
          ========================================== */}
          <WelcomeCard name="แอดมินคนหล่อ" description="admin" />

          {/* ==========================================
              Summary Cards
          ========================================== */}
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

          {/* ==========================================
              1. Pending
          ========================================== */}
          <section className="mb-8">
            <SectionHeader
              title="คำร้องรอพิจารณา"
              description="รายการคำร้องที่ต้องตรวจสอบและดำเนินการ"
              href="/admin/pending"
            />

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <AdminRequestsList hideFilters />
            </div>
          </section>

          {/* ==========================================
              2. Disbursement
          ========================================== */}
          <section className="mb-8">
            <SectionHeader
              title="รายการเบิกจ่าย"
              description="รายการที่ผ่านการอนุมัติและพร้อมดำเนินการโอนเงิน"
              href="/admin/disburse-debt"
            />

            <DisburseDebtCard requests={disbursementRequests as any} />
          </section>

          {/* ==========================================
              3. Verify Slip
          ========================================== */}
          <section className="mb-8">
            <SectionHeader
              title="ตรวจสอบสลิปชำระเงิน"
              description="หลักฐานการโอนเงินที่รอตรวจสอบ"
              href="/admin/verify-slip"
            />

            <VerifySlipCard requests={verifySlipRequests as any} userRole="admin" />
          </section>
        </main>
      </div>
    </div>
  );
}

/* ==========================================
   Dashboard Stat Card
========================================== */

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
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-2">{title}</p>

          <p className="text-3xl font-bold text-[#1e293b]">{value}</p>

          <p className="text-xs text-gray-400 mt-2">{description}</p>
        </div>

        <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   Section Header
========================================== */

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
        <h2 className="text-lg font-bold text-[#1e293b]">{title}</h2>

        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>

      <a href={href} className="text-sm font-medium text-orange-600 hover:text-orange-700">
        ดูทั้งหมด →
      </a>
    </div>
  );
}
