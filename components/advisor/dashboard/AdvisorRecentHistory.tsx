'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import HistoryCard from '../history/HistoryCard'; // 1. นำเข้า HistoryCard จากไฟล์ใหม่

// Mock Data ประวัติคำร้องแบบ Timeline (ดึงมาแค่ 2 อันล่าสุดพอสำหรับหน้า Dashboard)
const mockHistory = [
  {
    requestId: 'SL-2026-000088',
    studentName: 'กมลชนก มีโชค',
    studentId: '651210001',
    timeline: [
      { status: 'ส่งคำร้องกู้ยืม', timestamp: '18 ธ.ค. 2569 10:00 น.', actor: 'กมลชนก มีโชค', isDone: true },
      { status: 'อาจารย์ที่ปรึกษาอนุมัติ', timestamp: '18 ธ.ค. 2569 10:00 น.', actor: 'พิมมา มีโชค', isDone: true },
      { status: 'เจ้าหน้าที่ตรวจสอบเอกสาร', timestamp: '18 ธ.ค. 2569 10:00 น.', actor: 'วรัญญู มีโชค', isDone: true },
      { status: 'ผู้บริหารพิจารณาอนุมัติ', timestamp: '', actor: '', isDone: false }
    ]
  },
  {
    requestId: 'SL-2026-000089',
    studentName: 'ปิยะพงษ์ สุขใจ',
    studentId: '651210042',
    timeline: [
      { status: 'ส่งคำร้องกู้ยืม', timestamp: '19 ธ.ค. 2569 09:30 น.', actor: 'ปิยะพงษ์ สุขใจ', isDone: true },
      { status: 'อาจารย์ที่ปรึกษาอนุมัติ', timestamp: '', actor: '', isDone: false },
      { status: 'เจ้าหน้าที่ตรวจสอบเอกสาร', timestamp: '', actor: '', isDone: false },
      { status: 'ผู้บริหารพิจารณาอนุมัติ', timestamp: '', actor: '', isDone: false }
    ]
  }
];

export default function AdvisorRecentHistory() {
  const router = useRouter();

  return (
    <div className="w-full">
      {/* Header ของกล่องประวัติ */}
      <div className="flex justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] mb-1">ประวัติการดำเนินการ</h1>
        </div>
        <button 
          onClick={() => router.push('/advisor/history')}
          className="text-[13.5px] font-bold text-[#ea580c] hover:text-[#c2410c] hover:underline"
        >
          ดูทั้งหมด
        </button>
      </div>

      {/* 2. เรียกใช้งาน HistoryCard แทนการเขียน UI ซ้ำๆ */}
      <div className="grid grid-cols-1 gap-5">
        {mockHistory.map((historyItem, index) => (
          <HistoryCard 
            key={index}
            historyItem={historyItem}
            onClick={() => router.push('/advisor/history/details')}
          />
        ))}
      </div>
    </div>
  );
}