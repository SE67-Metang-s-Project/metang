"use client";

import React, { useMemo, useState } from "react";

import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";
import WelcomeCard from "@/components/shared/WelcomeCard";

import SuperAdminRequestsList from "@/components/superadmin/pending/SuperAdminRequestsList";
import DisburseDebtCard, {
  ActionRequest as DisburseActionRequest,
} from "@/components/shared/disburse-debt/DisburseDebtCard";
import VerifySlipCard, {
  ActionRequest as VerifySlipActionRequest,
  PaymentEvidence,
} from "@/components/shared/verify-slip/VerifySlipCard";
import UserRolesTab from "@/components/superadmin/setting/UserRolesTab";
import SystemBudgetTab from "@/components/superadmin/setting/SystemBudgetTab";
import FinancialOverview from "@/components/shared/financial/FinancialOverview";

import { mockAdminRequests } from "@/components/shared/mock-data/mockAdminRequests";
import type {
  ExecutiveFinancialOverviewData,
  FinancialOverviewPoint,
} from "@/lib/financial-overview-types";
import { getMockExecutiveFinancialOverview } from "@/lib/mock-data/executive-financial-overview";
import { Users, Wallet } from "lucide-react";
import type { ActionRequest } from "@/components/shared/pending/RequestsCard";
import type { SuperAdminUser } from "@/lib/loan-api-types";

type SuperAdminDashboardProps = {
  userName?: string;
  userId?: string;
  currentUserId?: string;
  financialOverview?: ExecutiveFinancialOverviewData;
  initialRequests?: ActionRequest[];
  initialUsers?: SuperAdminUser[];
};

export default function SuperAdminDashboard({
  userName = "Super Admin สูงสุด",
  userId = "SA-001",
  currentUserId,
  financialOverview,
  initialRequests,
  initialUsers,
}: SuperAdminDashboardProps = {}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const requests = useMemo(() => {
    if (initialRequests && initialRequests.length > 0) {
      return initialRequests;
    }
    return mockAdminRequests as unknown as ActionRequest[];
  }, [initialRequests]);

  // Fallback mock financial data if not passed from server
  const fallbackOverview = useMemo(() => {
    const mock = getMockExecutiveFinancialOverview();
    return {
      ...mock,
      quarterly: (mock as unknown as { quarterly?: FinancialOverviewPoint[] }).quarterly ?? [],
    } as ExecutiveFinancialOverviewData;
  }, []);

  const resolvedFinancialOverview = financialOverview ?? fallbackOverview;

  // แท็บย่อยสำหรับการตั้งค่าระบบ
  const [settingsSubTab, setSettingsSubTab] = useState<"users" | "budget">("users");

  // =====================================================
  // 1. รายการที่ผู้บริหารอนุมัติแล้ว และรอเบิกจ่ายเงิน
  // =====================================================
  const disbursementRequests = useMemo(() => {
    return requests.filter((req) => req.requestStatus === "pending_disbursement");
  }, [requests]);

  // =====================================================
  // 3. รายการที่มีสลิป และสลิปนั้นยังรอตรวจสอบ
  // =====================================================
  const verifySlipRequests = useMemo(() => {
    return requests.filter((req) => {
      return (
        Array.isArray(req.paymentHistory) &&
        req.paymentHistory.some(
          (payment: { status?: string }) => payment.status === "pending"
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
        role="superadmin"
      />

      {/* =====================================================
          Main Content
      ===================================================== */}
      <div className="flex-1 flex flex-col w-full min-h-screen min-[1576px]:ml-64">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName={userName}
          userId={userId}
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {/* =====================================================
              Welcome
          ===================================================== */}
          <WelcomeCard
            name={userName}
            description="ผู้ดูแลระบบระดับสูง (Super Administrator)"
          />

          {/* =====================================================
              Financial Overview (รายงานและสถิติทางการเงินของระบบ)
          ===================================================== */}
          <section className="mb-10">
            <div className="w-full font-[family-name:var(--font-kanit)]">
              <FinancialOverview initialData={resolvedFinancialOverview} />
            </div>
          </section>

          {/* =====================================================
              1. Pending Review
          ===================================================== */}
          <section className="mb-10">
            <SectionHeader
              title="คำร้องรอพิจารณา"
              description="รายการคำร้องที่สามารถปรับแก้วงเงินและพิจารณาอนุมัติได้"
              href="/superadmin/pending"
            />

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <SuperAdminRequestsList hideFilters dashboardMode="pending" initialRequests={requests} />
            </div>
          </section>

          {/* =====================================================
              2. Disbursement
          ===================================================== */}
          <section className="mb-10">
            <SectionHeader
              title="รายการเบิกจ่าย"
              description="รายการที่ผ่านการอนุมัติจากผู้บริหารและรอการโอนเงิน"
              href="/superadmin/disburse-debt"
            />

            {disbursementRequests.length > 0 ? (
              <DisburseDebtCard
                requests={disbursementRequests as unknown as DisburseActionRequest[]}
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
              href="/superadmin/verify-slip"
            />

            {verifySlipRequests.length > 0 ? (
              <VerifySlipCard
                requests={verifySlipRequests as unknown as VerifySlipActionRequest[]}
                userRole="super_admin"
              />
            ) : (
              <EmptyState
                icon="🧾"
                title="ไม่มีสลิปที่รอตรวจสอบ"
                description="ขณะนี้ยังไม่มีหลักฐานการโอนเงินที่รอตรวจสอบ"
              />
            )}
          </section>

          {/* =====================================================
              4. System Settings
          ===================================================== */}
          <section className="mb-10">
            <SectionHeader
              title="ตั้งค่าระบบ"
              description="ศูนย์ควบคุมจัดการผู้ใช้ บทบาท และวงเงินงบประมาณระบบ"
              href="/superadmin/settings"
            />

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="inline-flex bg-slate-100/80 p-1 rounded-xl mb-6 shadow-sm border border-slate-200/50">
                <button
                  onClick={() => setSettingsSubTab("users")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    settingsSubTab === "users"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <Users
                    size={18}
                    className={settingsSubTab === "users" ? "text-slate-700" : "text-slate-500"}
                  />
                  ผู้ใช้และบทบาท
                </button>
                <button
                  onClick={() => setSettingsSubTab("budget")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    settingsSubTab === "budget"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <Wallet
                    size={18}
                    className={settingsSubTab === "budget" ? "text-slate-700" : "text-slate-500"}
                  />
                  วงเงินระบบ
                </button>
              </div>

              {settingsSubTab === "users" && (
                <UserRolesTab initialUsers={initialUsers} currentUserId={currentUserId} />
              )}
              {settingsSubTab === "budget" && <SystemBudgetTab />}
            </div>
          </section>
        </main>
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

