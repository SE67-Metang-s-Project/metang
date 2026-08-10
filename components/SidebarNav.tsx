'use client';

import React from "react";
import { 
  LayoutDashboard, 
  FileCheck,
  GraduationCap, 
  X,
  FileText,
  Files,
  Users,
  History,
  Wallet,
  FileSignature,
  FileSearch,
  PieChart,
  Settings,
  UserCog
} from "lucide-react";

// กำหนดประเภทของ Role ทั้งหมดในระบบ
export type UserRole = 'student' | 'teacher' | 'admin' | 'executive' | 'superadmin';

// กำหนดโครงสร้างของเมนู
interface MenuItem {
  title: string;
  icon: React.ElementType;
  href: string;
}

interface SideNavProps {
  isOpen: boolean;
  role: UserRole; // รับค่า Role เพื่อดึงเมนูให้ตรงกับสิทธิ์
  currentPath?: string; // ใช้เช็คว่าหน้าไหนดึงเมนูมาใช้อยู่ เพื่อทำ Active State
  onClose: () => void;
}

// ตั้งค่ารายการเมนูแยกตาม Role
const menuConfig: Record<UserRole, MenuItem[]> = {
  student: [
    { title: 'แดชบอร์ด', icon: LayoutDashboard, href: '/student' },
    { title: 'ยื่นคำร้องขอกู้ยืม', icon: FileText, href: '/student/request' },
    { title: 'ชำระเงินคืน (e-Slip)', icon: Wallet, href: '/student/payment' },
    { title: 'ประวัติคำร้อง', icon: History, href: '/student/history' },
  ],
  teacher: [
    { title: 'แดชบอร์ด', icon: LayoutDashboard, href: '/teacher' },
    { title: 'คำร้องรอพิจารณา', icon: FileCheck, href: '/teacher/pending' },
    { title: 'นักศึกษาในความดูแล', icon: Users, href: '/teacher/students' },
    { title: 'ประวัติการดำเนินการ', icon: History, href: '/teacher/history' },
  ],
  admin: [
    { title: 'แดชบอร์ด', icon: LayoutDashboard, href: '/admin' },
    { title: 'คำร้องทั้งหมด', icon: Files, href: '/admin/requests' },
    { title: 'ตรวจสอบ e-Slip', icon: FileSearch, href: '/admin/verify-slip' },
    { title: 'จัดทำสัญญายืมเงิน', icon: FileSignature, href: '/admin/contracts' },
    { title: 'ติดตามสถานะหนี้', icon: Users, href: '/admin/tracking' },
  ],
  executive: [
    { title: 'แดชบอร์ด', icon: LayoutDashboard, href: '/executive' },
    { title: 'พิจารณาอนุมัติคำร้อง', icon: FileCheck, href: '/executive/approve' },
    { title: 'รายงานและสถิติ', icon: PieChart, href: '/executive/reports' },
  ],
  superadmin: [
    { title: 'แดชบอร์ด', icon: LayoutDashboard, href: '/superadmin' },
    { title: 'จัดการผู้ใช้งาน', icon: UserCog, href: '/superadmin/users' },
    { title: 'ตั้งค่าระบบ', icon: Settings, href: '/superadmin/settings' },
  ]
};

export default function SideNav({ isOpen, role, currentPath = '', onClose }: SideNavProps) {
  // ดึงรายการเมนูมาตาม Role ที่ส่งเข้ามา
  const menus = menuConfig[role] || [];

  return (
    <>
      {/* Background Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col h-screen transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo Area */}
        <div className="h-16 sm:h-20 flex items-center justify-between px-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center">
            <div className="bg-[#ea580c] text-white p-2.5 rounded-xl mr-3 shadow-sm">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="font-bold text-[15px] text-gray-900 leading-tight">
                CMU Student Loan
              </h1>
              <p className="text-[12px] text-gray-500">ระบบทุนกู้ยืม</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-700 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 text-sm font-medium overflow-y-auto">
          {menus.map((item, index) => {
            const Icon = item.icon;
            
            // เช็คว่าเมนูนี้คือหน้าปัจจุบันหรือไม่ (ถ้าไม่มีค่า currentPath ส่งมา ให้เมนูแรกเป็น Active ไปก่อนชั่วคราว)
            const isActive = currentPath === item.href || (currentPath === '' && index === 0);

            return (
              <a
                key={index}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? "text-white bg-[#ea580c] shadow-md shadow-orange-500/20" 
                    : "text-gray-600 hover:bg-orange-50 hover:text-[#ea580c]"
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : ''}`} />
                {item.title}
              </a>
            );
          })}
        </nav>
      </aside>
    </>
  );
}