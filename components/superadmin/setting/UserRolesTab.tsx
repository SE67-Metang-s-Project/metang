// src/components/superadmin/setting/UserRolesTab.tsx
"use client";

import React, { useState } from "react";
import { Search, ChevronRight, Star } from "lucide-react";
import { mockSettingsUsers } from "@/components/shared/mock-data/mockSettingsUsers";

export default function UserRolesTab() {
  const [searchQuery, setSearchQuery] = useState("");

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "นักศึกษา": return "bg-blue-100 text-blue-700";
      case "อาจารย์ที่ปรึกษา": return "bg-emerald-100 text-emerald-700";
      case "เจ้าหน้าที่": return "bg-orange-100 text-orange-700";
      case "ผู้ดูแลระบบ": return "bg-slate-900 text-white";
      case "ผู้บริหาร": return "bg-purple-100 text-purple-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

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
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
        <div className="w-full sm:w-48">
          <select className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer appearance-none">
            <option>ทุกบทบาท</option>
            <option>นักศึกษา</option>
            <option>อาจารย์ที่ปรึกษา</option>
            <option>เจ้าหน้าที่</option>
            <option>ผู้บริหาร</option>
            <option>ผู้ดูแลระบบ</option>
          </select>
        </div>
      </div>

      {/* User List */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 mb-4 px-2">ผู้ใช้ ({mockSettingsUsers.length})</h2>
        <div className="space-y-3">
          {mockSettingsUsers.map((user, index) => (
            <div
              key={user.id}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                index === 0 ? "border-blue-400 bg-blue-50/30" : "border-gray-200 hover:border-blue-300 hover:bg-slate-50"
              } transition-colors cursor-pointer group`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold shrink-0">
                  {user.initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm">{user.name}</span>
                    {user.isStarred && <Star size={14} className="fill-purple-500 text-purple-500" />}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {user.email} · {user.id}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${getRoleBadgeStyle(user.role)}`}>
                  {user.role}
                </span>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}