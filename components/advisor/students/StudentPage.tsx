"use client";

import React, { useState } from "react";
import SideNav from "@/components/shared/SidebarNav";
import TopNav from "@/components/shared/TopNav";

// Import Component ย่อยที่เราสร้างไว้
import StudentFilters from "./StudentFilters"; 
// เปลี่ยนชื่อ Import ให้สอดคล้องกับ Component ใหม่ที่เราแก้เป็นตาราง
import StudentListTable from "./StudentListItem"; 

// Mock Data รายชื่อนักศึกษา
const mockStudents = [
  {
    initial: "ก",
    name: "กมลชนก ใจดี",
    studentId: "651210001",
    major: "พยาบาลศาสตรบัณฑิต",
    year: "3",
    requestStatus: "รออาจารย์ที่ปรึกษาอนุมัติ",
    paymentStatus: "จ่ายตรงเวลาเสมอ",
    totalBorrowed: "50,000",
    paymentStatusType: "good", // เขียว
    balance: "17,501",
    delayDays: "0",
  },
  {
    initial: "ป",
    name: "ปิยะพงษ์ สุขใจ",
    studentId: "651210042",
    major: "พยาบาลศาสตรบัณฑิต",
    year: "2",
    requestStatus: "รออาจารย์ที่ปรึกษาอนุมัติ",
    paymentStatus: "มีหนี้เกินกำหนด",
    totalBorrowed: "30,000",
    paymentStatusType: "bad", // แดง
    balance: "16,500",
    delayDays: "0",
  },
  {
    initial: "อ",
    name: "อริสรา แสงจันทร์",
    studentId: "651210077",
    major: "พยาบาลศาสตรบัณฑิต",
    year: "4",
    requestStatus: "รออาจารย์ที่ปรึกษาอนุมัติ",
    paymentStatus: "มีหนี้เกินกำหนด",
    totalBorrowed: "40,000",
    paymentStatusType: "bad", // แดง
    balance: "18,501",
    delayDays: "9",
  },
  {
    initial: "ธ",
    name: "ธีรภัทร วัฒนา",
    studentId: "651210103",
    major: "พยาบาลศาสตรบัณฑิต",
    year: "3",
    requestStatus: "รออาจารย์ที่ปรึกษาอนุมัติ",
    totalBorrowed: "20,000",
    paymentStatus: "ยังไม่มีประวัติชำระ",
    paymentStatusType: "neutral", // เทา
    balance: "12,000",
    delayDays: "0",
  },
  {
    initial: "ณ",
    name: "ณิชา ประเสริฐ",
    studentId: "651210158",
    major: "พยาบาลศาสตรบัณฑิต",
    year: "2",
    requestStatus: "รออาจารย์ที่ปรึกษาอนุมัติ",
    totalBorrowed: "10,000",
    paymentStatus: "ยังไม่มีประวัติชำระ",
    paymentStatusType: "neutral", // เทา
    balance: "9,999",
    delayDays: "0",
  },
];

const filterTabs = [
  "ทั้งหมด",
  "มีคำร้องดำเนินการ",
  "ไม่มีคำร้อง",
  "มีหนี้คงเหลือ",
  "ชำระครบ",
  "เคยชำระล่าช้า",
];

export default function StudentList() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ทั้งหมด");

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      {/* SideNav */}
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="advisor" />

      <main className="flex-1 flex flex-col w-full min-h-screen lg:ml-64 transition-all duration-300">
        
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          userName="ผศ.ดร. สุนีย์ วงค์ประเสริฐ"
          userId="T1002"
        />

        <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] w-full mx-auto space-y-6">
          
          {/* Header Title ของหน้า */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] mb-1">นักศึกษาในความดูแล</h1>
            <p className="text-[13px] text-gray-500">รายชื่อนักศึกษาที่อยู่ภายใต้การดูแลของท่าน</p>
          </div>

          <StudentFilters 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            filterTabs={filterTabs}
          />

          {/* 
            แก้ไขส่วนนี้: ลบการ map() ออก แล้วส่ง mockStudents เข้าไปที่ props students โดยตรง
          */}
          <div className="mt-2">
            <StudentListTable students={mockStudents as any} />
          </div>

        </div>
      </main>
    </div>
  );
}