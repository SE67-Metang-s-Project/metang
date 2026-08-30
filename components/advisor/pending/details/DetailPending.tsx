"use client";

import React, { useState } from "react";
import SideNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav"; // 1. Import TopNav ที่สร้างใหม่เข้ามา

export default function DetailPending() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-gray-800">
      {/* Sidebar Navigation */}
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role="advisor" />
    </div>
  )

}