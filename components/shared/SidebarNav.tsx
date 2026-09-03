'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  UserCog,
  Bug 
} from "lucide-react";

export type UserRole = 'student' | 'advisor' | 'admin' | 'executive' | 'superadmin';

interface MenuItem {
  title: string;
  icon: React.ElementType;
  href: string | ((role: UserRole) => string); 
  roles: UserRole[]; 
}

interface SideNavProps {
  isOpen: boolean;
  role: UserRole;
  onClose: () => void;
}

const ALL_MENU_ITEMS: MenuItem[] = [
  { title: 'หน้าหลัก', icon: LayoutDashboard, href: (role) => `/${role}`, roles: ['student', 'admin', 'executive', 'superadmin'] },
  { title: 'ยื่นคำร้องขอกู้ยืม', icon: FileText, href: '/student/request', roles: ['student'] },
  { title: 'ชำระเงินคืน (e-Slip)', icon: Wallet, href: '/student/payment', roles: ['student'] },
  { title: 'ประวัติคำร้อง', icon: History, href: '/student/history', roles: ['student'] },

  // ==========================================
  // แยกเมนู "คำร้องรอพิจารณา" ตาม Role
  // ==========================================
  // 1. สำหรับอาจารย์ที่ปรึกษา
  { title: 'คำร้องรอพิจารณา จากอาจารย์ที่ปรึกษา', icon: FileCheck, href: '/advisor/pending', roles: ['advisor'] },
  
  // 2. สำหรับเจ้าหน้าที่ (Admin)
  { title: 'คำร้องรอพิจารณา จากเจ้าหน้าที่', icon: FileCheck, href: '/admin/pending', roles: ['admin'] },
  
  // 3. สำหรับผู้บริหาร (แสดง 2 เมนู ตามที่ระบุ)
  { title: 'คำร้องรอพิจารณา จากอาจารย์ที่ปรึกษา', icon: FileCheck, href: '/executive/pending-advisor', roles: ['executive'] },
  { title: 'คำร้องรอพิจารณา จากผู้บริหาร', icon: FileCheck, href: '/executive/pending-executive', roles: ['executive'] },
  // ==========================================

  { title: 'นักศึกษาในความดูแล', icon: Users, href: (role) => `/${role}/students`, roles: ['advisor', 'executive'] },
  { title: 'รายงานและสถิติ', icon: PieChart, href: '/executive/reports', roles: ['executive'] },
  { title: 'เบิกจ่ายหนี้', icon: FileSignature, href: '/admin/disburse-debt', roles: ['admin'] },
  { title: 'ตรวจสอบสลิปชำระเงิน', icon: FileSearch, href: '/admin/verify-slip', roles: ['admin'] },
  { title: 'จัดการผู้ใช้งาน', icon: UserCog, href: '/superadmin/users', roles: ['superadmin'] },
  { title: 'ตั้งค่าระบบ', icon: Settings, href: '/superadmin/settings', roles: ['superadmin'] },
];

export default function SideNav({ isOpen, role, onClose }: SideNavProps) {
  const pathname = usePathname(); 

  const [debugRole, setDebugRole] = useState<UserRole>(role);
  
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setDebugRole(role);
  }, [role]);

  const allowedMenus = ALL_MENU_ITEMS.filter(item => item.roles.includes(debugRole));

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col h-screen transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
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

        <nav className="flex-1 py-6 px-4 space-y-1.5 text-sm font-medium overflow-y-auto">
          {allowedMenus.map((item, index) => {
            const Icon = item.icon;
            const resolvedHref = typeof item.href === 'function' ? item.href(debugRole) : item.href;
            
            const isActive = isMounted ? pathname === resolvedHref : false;

            return (
              <Link
                key={index}
                href={resolvedHref}
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

        {process.env.NODE_ENV === "development" && (
          <div className="p-4 bg-orange-50/50 border-t border-orange-100 shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-600 mb-2">
              <Bug size={14} /> DEBUG: Switch Role
            </div>
            <select
              value={debugRole}
              onChange={(e) => setDebugRole(e.target.value as UserRole)}
              className="w-full bg-white border border-orange-200 text-gray-700 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block px-3 py-2 cursor-pointer shadow-sm"
            >
              <option value="student">Student</option>
              <option value="advisor">Advisor</option>
              <option value="admin">Admin</option>
              <option value="executive">Executive</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>
        )}
      </aside>
    </>
  );
}