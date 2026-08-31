'use client';

import React from "react";
import { Menu } from "lucide-react";

interface TopNavProps {
  onOpenSidebar: () => void;
  userName: string;
  userId: string;
}

export default function TopNav({ onOpenSidebar, userName, userId }: TopNavProps) {
  return (
    <header className="h-16 sm:h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      
      {/* ปุ่มเปิด Sidebar สำหรับมือถือ (แสดงเฉพาะหน้าจอเล็ก) */}
      <div className="flex items-center lg:hidden">
        <button 
          onClick={onOpenSidebar} 
          className="p-2 -ml-2 mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* พื้นที่ว่างตรงกลาง เพื่อดันโปรไฟล์ไปทางขวา */}
      <div className="flex-1"></div>

      {/* ส่วนโปรไฟล์ผู้ใช้งาน (ด้านขวา) */}
      <div className="flex items-center gap-3">
        {/* รูปโปรไฟล์ (อิงจากภาพที่เป็นวงกลมสีฟ้าอ่อน) */}
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium text-sm">
          {userName.substring(0, 2)} {/* ดึงตัวอักษร 2 ตัวแรกมาแสดง */}
        </div>
        
        {/* ข้อมูลชื่อและรหัส */}
        <div className="flex flex-col">
          <span className="font-bold text-[15px] text-gray-900 leading-tight">
            {userName}
          </span>
          <span className="text-[13px] text-gray-500">
            {userId}
          </span>
        </div>
      </div>

    </header>
  );
}