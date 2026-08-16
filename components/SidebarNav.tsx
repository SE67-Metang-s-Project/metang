'use client';

import React from "react";
import Link from "next/link"; // 1. นำเข้า Link จาก Next.js
import { usePathname } from "next/navigation"; // 2. นำเข้า usePathname
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
export type UserRole = 'student' | 'professor' | 'admin' | 'executive' | 'superadmin';

// กำหนดโครงสร้างของเมนู
interface MenuItem {
  title: string;
  icon: React.ElementType;
  href: string;
}

interface SideNavProps {
  isOpen: boolean;
  role: UserRole;
  onClose: () => void;
  // ไม่ต้องรับ currentPath จาก Props แล้ว เพราะเราจะดึงอัตโนมัติ
}

// ตั้งค่ารายการเมนูแยกตาม Role
const menuConfig: Record<UserRole, MenuItem[]> = {
  student: [
    { title: 'แดชบอร์ด', icon: LayoutDashboard, href: '/student' },
    { title: 'ยื่นคำร้องขอกู้ยืม', icon: FileText, href: '/student/request' },
    { title: 'ชำระเงินคืน (e-Slip)', icon: Wallet, href: '/student/payment' },
    { title: 'ประวัติคำร้อง', icon: History, href: '/student/history' },
  ],
  professor: [
    { title: 'แดชบอร์ด', icon: LayoutDashboard, href: '/professor' },
    { title: 'คำร้องรอพิจารณา', icon: FileCheck, href: '/professor/pending' },
    { title: 'นักศึกษาในความดูแล', icon: Users, href: '/professor/students' },
    { title: 'ประวัติการดำเนินการ', icon: History, href: '/professor/history' },
  ],
  admin: [
    { title: 'แดชบอร์ด', icon: LayoutDashboard, href: '/admin' },
    { title: 'คำร้องทั้งหมด', icon: Files, href: '/admin/requests' },
    { title: 'ตรวจสอบสลิปชำระเงิน', icon: FileSearch, href: '/admin/verify-slip' },
    { title: 'เบิกจ่ายหนี้', icon: FileSignature, href: '/admin/disburse-debt' },
    { title: 'ติดตามสถานะหนี้', icon: Users, href: '/admin/tracking' },
    { title: 'ประวัติการดำเนินการ', icon: History, href: '/admin/history' },
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

export default function SideNav({ isOpen, role, onClose }: SideNavProps) {
  const menus = menuConfig[role] || [];
  
  // 3. ใช้ hook เพื่อดึง path ปัจจุบันอัตโนมัติ (เช่น '/professor/pending')
  const pathname = usePathname(); 

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
            
            // 4. เปรียบเทียบ url ปัจจุบันกับ href ของเมนู
            const isActive = pathname === item.href;

            return (
              // 5. เปลี่ยนจาก <a href="..."> เป็น <Link href="...">
              <Link
                key={index}
                href={item.href}
                // ถ้ากดเมนูบนมือถือ ให้ปิด Sidebar อัตโนมัติด้วย
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`flex items-center px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? "text-white bg-[#ea580c] shadow-md shadow-orange-500/20" 
                    : "text-gray-600 hover:bg-orange-50 hover:text-[#ea580c]"
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : ''}`} />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}