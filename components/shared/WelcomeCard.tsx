import React from 'react';

interface WelcomeCardProps {
  name: string;
  description: string;
  // เผื่ออนาคตอยากเปลี่ยนสี Background ของแต่ละ Role ก็ส่ง className เข้ามาทับได้
  className?: string; 
}

export default function WelcomeCard({ 
  name, 
  description,
  className = "bg-gradient-to-r from-[#ea580c] to-[#f97316]" // ค่าเริ่มต้นเป็นสีส้มตามภาพ
}: WelcomeCardProps) {
  return (
    <div className={`rounded-[16px] p-6 sm:p-8 text-white shadow-sm mb-8 ${className}`}>
      <h2 className="text-2xl font-bold mb-2">สวัสดี, {name}</h2>
      <p className="text-sm opacity-90">{description}</p>
    </div>
  );
}