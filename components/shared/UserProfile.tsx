import React from 'react';

// กำหนด Props เพื่อให้รองรับข้อมูลที่เปลี่ยนไปตามผู้ใช้งานแต่ละคน (Dynamic)
interface UserProfileProps {
  name: string;
  id: string;
  initials: string;
}

export default function UserProfile({ name, id, initials }: UserProfileProps) {
  return (
    <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer hover:bg-gray-50 p-1 sm:p-2 rounded-lg transition-colors">
      {/* วงกลมตัวย่อชื่อ (Avatar) */}
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-orange-100 text-[#ea580c] flex items-center justify-center font-bold text-xs sm:text-sm border border-orange-200 shrink-0">
        {initials}
      </div>
      
      {/* ข้อมูลชื่อและรหัส (ซ่อนในจอมือถือ) */}
      <div className="text-right hidden sm:block">
        <p className="text-sm font-bold text-[#0f172a]">{name}</p>
        <p className="text-xs text-gray-500">{id}</p>
      </div>
    </div>
  );
}