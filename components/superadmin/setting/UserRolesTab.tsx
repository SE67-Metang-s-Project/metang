// src/components/superadmin/setting/UserRolesTab.tsx
"use client";

import React, { useState } from "react";
import { Search, ChevronDown, Star, SearchX } from "lucide-react";
import { mockSettingsUsers } from "@/components/shared/mock-data/mockSettingsUsers";

export default function UserRolesTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ทุกบทบาท");

  // นำ mock data มาใส่ State เพื่อให้สามารถเปลี่ยนค่า Role และอัปเดต UI ได้
  const [usersList, setUsersList] = useState(mockSettingsUsers);

  // ฟังก์ชันอัปเดต Role
  const handleRoleChange = (userId: string, newRole: string) => {
    setUsersList((prevUsers) =>
      prevUsers.map((user) => (user.id === userId ? { ...user, role: newRole } : user)),
    );
  };

  // กรองข้อมูลตามคำค้นหาและบทบาท
  const filteredUsers = usersList.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ทุกบทบาท" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="animate-in fade-in duration-300">
      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ / อีเมล / รหัส CMU"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-sm cursor-pointer appearance-none"
          >
            <option value="ทุกบทบาท">ทุกบทบาท</option>
            <option value="นักศึกษา">นักศึกษา</option>
            <option value="อาจารย์ที่ปรึกษา">อาจารย์ที่ปรึกษา</option>
            <option value="เจ้าหน้าที่">เจ้าหน้าที่</option>
            <option value="ผู้บริหาร">ผู้บริหาร</option>
            <option value="ผู้ดูแลระบบ">ผู้ดูแลระบบ</option>
          </select>
        </div>
      </div>

      {/* User List Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-100 bg-white">
          <h2 className="text-sm font-bold text-gray-900">ผู้ใช้ ({filteredUsers.length})</h2>
        </div>

        {/* 1. มุมมองสำหรับ Mobile (แสดงเป็นการ์ด) */}
        <div className="md:hidden p-4 space-y-3 bg-gray-50/30">
          {filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-gray-500 flex flex-col items-center">
              <SearchX className="h-8 w-8 mb-2 text-gray-400" />
              <p className="text-sm">ไม่พบผู้ใช้งานที่ค้นหา</p>
            </div>
          ) : (
            filteredUsers.map((user, index) => (
              <div
                key={user.id}
                className={`flex flex-col gap-3 p-3.5 rounded-xl border ${
                  index === 0 ? "border-orange-400 bg-orange-50/30" : "border-gray-200 bg-white"
                } transition-colors group shadow-sm`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-semibold shrink-0">
                      {user.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-[14px] leading-tight">
                          {user.name}
                        </span>
                        {user.isStarred && (
                          <Star size={14} className="fill-orange-500 text-orange-500" />
                        )}
                      </div>
                      <div className="text-[12px] text-gray-500 mt-0.5">{user.id}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="text-[12px] text-gray-600 truncate pr-2">{user.email}</div>

                  {/* Dropdown เปลี่ยนสิทธิ์ (Mobile) - สีโทนกลาง */}
                  <div className="relative shrink-0">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-[12px] font-medium text-gray-700 bg-white border border-gray-300 hover:border-gray-400 outline-none cursor-pointer transition-all focus:ring-2 focus:ring-orange-500/20"
                    >
                      <option value="นักศึกษา">นักศึกษา</option>
                      <option value="อาจารย์ที่ปรึกษา">อาจารย์ที่ปรึกษา</option>
                      <option value="เจ้าหน้าที่">เจ้าหน้าที่</option>
                      <option value="ผู้บริหาร">ผู้บริหาร</option>
                      <option value="ผู้ดูแลระบบ">ผู้ดูแลระบบ</option>
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 2. มุมมองสำหรับ Desktop/Tablet (แสดงเป็นตาราง) */}
        <div className="hidden md:block overflow-x-auto relative">
          <table className="w-full text-left border-collapse bg-white">
            <colgroup>
              <col className="w-[40%]" />
              <col className="w-[35%]" />
              <col className="w-[25%]" />
            </colgroup>
            <thead>
              <tr className="bg-gray-100/70 border-b border-gray-200 text-gray-700 text-[13px]">
                <th className="py-3.5 px-6 font-semibold border-r border-gray-200">
                  ชื่อผู้ใช้งาน
                </th>
                <th className="py-3.5 px-6 font-semibold border-r border-gray-200">
                  อีเมล / รหัสประจำตัว
                </th>
                <th className="py-3.5 px-6 font-semibold text-center">บทบาท</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <SearchX className="h-8 w-8 mb-2 text-gray-400" />
                      <p className="text-sm">ไม่พบผู้ใช้งานที่ค้นหา</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`border-b border-gray-100 hover:bg-slate-50 transition-colors group ${
                      index === 0 ? "bg-orange-50/20" : ""
                    }`}
                  >
                    <td className="py-3 px-6 border-r border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[13px] font-semibold shrink-0">
                          {user.initials}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-[14px]">{user.name}</span>
                          {user.isStarred && (
                            <Star size={14} className="fill-orange-500 text-orange-500" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6 border-r border-gray-100">
                      <div className="text-[13px] text-gray-700">{user.email}</div>
                      <div className="text-[12px] text-gray-400 mt-0.5">{user.id}</div>
                    </td>
                    <td className="py-3 px-6 align-middle">
                      <div className="flex justify-center">
                        {/* Dropdown เปลี่ยนสิทธิ์ (Desktop) - สีโทนกลาง */}
                        <div className="relative inline-block w-40">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="w-full appearance-none pl-4 pr-8 py-1.5 rounded-lg text-[13px] font-medium text-gray-700 bg-white border border-gray-300 hover:border-gray-400 outline-none cursor-pointer transition-all focus:ring-2 focus:ring-orange-500/20"
                          >
                            <option value="นักศึกษา">นักศึกษา</option>
                            <option value="อาจารย์ที่ปรึกษา">อาจารย์ที่ปรึกษา</option>
                            <option value="เจ้าหน้าที่">เจ้าหน้าที่</option>
                            <option value="ผู้บริหาร">ผู้บริหาร</option>
                            <option value="ผู้ดูแลระบบ">ผู้ดูแลระบบ</option>
                          </select>
                          <ChevronDown
                            size={14}
                            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
