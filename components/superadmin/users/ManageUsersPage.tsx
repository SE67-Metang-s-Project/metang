"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";
import { Search, Shield, Edit, MoreVertical, ShieldAlert } from "lucide-react";

// Mock Data ผู้ใช้งาน
const mockUsers = [
  { id: "U001", name: "สมชาย ใจดี", email: "somchai.j@cmu.ac.th", role: "student", department: "คณะพยาบาลศาสตร์" },
  { id: "U002", name: "ผศ.ดร. สุนีย์ วงค์ประเสริฐ", email: "sunee.w@cmu.ac.th", role: "advisor", department: "คณะพยาบาลศาสตร์" },
  { id: "U003", name: "นางสมศรี รักงาน", email: "somsri.r@cmu.ac.th", role: "admin", department: "กองพัฒนานักศึกษา" },
  { id: "U004", name: "รศ.ดร. สมเกียรติ ยอดเยี่ยม", email: "somkiat.y@cmu.ac.th", role: "executive", department: "ผู้บริหารคณะ" },
];

export default function ManageUsersPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState(mockUsers);

  // ฟังก์ชันเปลี่ยน Role
  const handleRoleChange = (userId: string, newRole: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    alert(`อัปเดตสิทธิ์ผู้ใช้งาน ${userId} เป็น ${newRole} สำเร็จ`);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "student": return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">Student</span>;
      case "advisor": return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded text-xs font-bold">Advisor</span>;
      case "admin": return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-1 rounded text-xs font-bold">Admin</span>;
      case "executive": return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded text-xs font-bold">Executive</span>;
      case "superadmin": return <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><ShieldAlert size={12}/> Super Admin</span>;
      default: return null;
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="superadmin" />

      <div className="flex-1 flex flex-col w-full min-h-screen lg:ml-64 transition-all duration-300">
        <TopNav onOpenSidebar={() => setIsSidebarOpen(true)} userName="Super Admin" userId="SA-001" />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="text-[#ea580c]" /> จัดการสิทธิ์ผู้ใช้งาน (Manage Roles)
              </h1>
              <p className="text-gray-500 mt-1 text-sm">ค้นหาและกำหนดระดับสิทธิ์ (Role) ให้กับบุคลากรและนักศึกษา</p>
            </div>
            
            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ หรือ อีเมล..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          {/* ตารางผู้ใช้งาน */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                    <th className="py-3 px-4 font-semibold">รหัส/อีเมล</th>
                    <th className="py-3 px-4 font-semibold">ชื่อ - นามสกุล</th>
                    <th className="py-3 px-4 font-semibold">สังกัด</th>
                    <th className="py-3 px-4 font-semibold text-center">ระดับสิทธิ์ (Role)</th>
                    <th className="py-3 px-4 font-semibold text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{user.id}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{user.name}</td>
                      <td className="py-3 px-4 text-gray-600 text-sm">{user.department}</td>
                      <td className="py-3 px-4 text-center">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center items-center gap-2">
                          <select 
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded p-1.5 bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer"
                          >
                            <option value="student">Student</option>
                            <option value="advisor">Advisor</option>
                            <option value="admin">Admin</option>
                            <option value="executive">Executive</option>
                            <option value="superadmin">Super Admin</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500 text-sm">
                        ไม่พบข้อมูลผู้ใช้งานที่ค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}