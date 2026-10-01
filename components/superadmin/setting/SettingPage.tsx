// app/superadmin/setting/page.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Search, UserPlus } from "lucide-react";

import type { SuperAdminUser } from "@/lib/loan-api-types";
import { PendingMainFilterTabs } from "@/components/shared/pending/PendingFilter";

// Import Components ที่เราแยกไว้
import UserRolesTab from "@/components/superadmin/setting/UserRolesTab";
import SystemBudgetTab from "@/components/superadmin/setting/SystemBudgetTab";
import SystemContactInfoTab from "@/components/superadmin/setting/SystemContactInfoTab";

interface SettingsPageProps {
  currentUserId?: string;
  initialUsers?: SuperAdminUser[];
}

export default function SettingsPage({
  currentUserId,
  initialUsers = [],
}: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<"users" | "budget" | "contact">("users");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ทุกบทบาท");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roleOptions = ["ทุกบทบาท", "ผู้ดูแลระบบ", "ผู้บริหาร", "ผู้ดูแลระบบสูงสุด"];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0f172a] mb-1">ศูนย์ควบคุมระบบ</h1>
        <p className="text-sm text-gray-500">
          SuperAdmin · จัดการผู้ใช้ บทบาท วงเงิน ข้อมูลและการติดต่อ
        </p>
      </div>

      {/* Tabs Toggle, Filter & Search */}
      <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <PendingMainFilterTabs
          currentFilter={activeTab}
          onFilterChange={(tab) => setActiveTab(tab as "users" | "budget" | "contact")}
          options={[
            { id: "users", label: "ผู้ใช้และบทบาท" },
            { id: "budget", label: "วงเงินระบบ" },
            { id: "contact", label: "ข้อมูลและการติดต่อ" },
          ]}
        />

        {activeTab === "users" && (
          <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            <div className="relative w-full sm:w-48" ref={roleDropdownRef}>
              <button
                type="button"
                onClick={() => setIsRoleDropdownOpen((isOpen) => !isOpen)}
                className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-2.5 text-left text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
                  isRoleDropdownOpen
                    ? "border-orange-500 text-gray-900"
                    : userRoleFilter === "ทุกบทบาท"
                      ? "border-gray-200 text-gray-700 hover:bg-gray-50"
                      : "border-[#ffedd5] bg-[#fff7ed] font-medium text-[#ea580c]"
                }`}
              >
                <span>{userRoleFilter === "ทุกบทบาท" ? "เลือกดูบทบาท:" : userRoleFilter}</span>
                {isRoleDropdownOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute right-0 top-full z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-gray-100 bg-white py-1.5 shadow-lg">
                  {roleOptions.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setUserRoleFilter(role);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-orange-50 ${
                        userRoleFilter === role
                          ? "bg-orange-50/50 font-medium text-[#ea580c]"
                          : "text-gray-700"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative w-full sm:w-[220px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ / อีเมล / รหัส CMU"
                value={userSearchQuery}
                onChange={(event) => setUserSearchQuery(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition-colors focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#ea580c] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#c2410c]"
            >
              <UserPlus size={16} />
              เพิ่มผู้ใช้งาน
            </button>
          </div>
        )}
      </div>

      {/* Render Tab Content */}
      {activeTab === "users" && (
        <UserRolesTab
          initialUsers={initialUsers}
          currentUserId={currentUserId}
          searchQuery={userSearchQuery}
          roleFilter={userRoleFilter}
          isAddModalOpen={isAddUserModalOpen}
          onAddModalOpenChange={setIsAddUserModalOpen}
        />
      )}
      {activeTab === "budget" && <SystemBudgetTab />}
      {activeTab === "contact" && <SystemContactInfoTab />}
    </div>
  );
}
