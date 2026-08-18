'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

export default function ProfessorRecentHistory() {
  const router = useRouter();

  return (
    <div className="w-full">
      {/* Header ของกล่องประวัติ */}
      <div className="flex justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] mb-1">ประวัติการดำเนินการ</h1>
        </div>
        <button 
          onClick={() => router.push('/professor/history')}
          className="text-[13.5px] font-bold text-[#ea580c] hover:text-[#c2410c] hover:underline"
        >
          ดูทั้งหมด
        </button>
      </div>

      {/* Grid สำหรับการ์ดประวัติ (ในหน้า Dashboard ให้แสดงเป็นคอลัมน์เดียวเรียงลงมา) */}
      <div className="grid grid-cols-1 gap-5">
        {mockHistory.map((historyItem, index) => (
          <div 
            key={index} 
            onClick={() => router.push('/professor/history/details')}
            className="cursor-pointer bg-white border border-gray-200 rounded-[16px] p-6 shadow-sm hover:shadow-md hover:border-orange-200 transition-all"
          >
            {/* Header (Student Info) */}
            <div className="mb-5 pb-4 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h3 className="text-[16px] font-bold text-[#1e293b] flex items-center gap-2 mb-1">
                  คำร้อง <span className="bg-[#f1f5f9] text-[#475569] px-2 py-0.5 rounded-md text-[13px] border border-gray-200">{historyItem.requestId}</span>
                </h3>
                <p className="text-[13px] text-gray-500">
                  {historyItem.studentName} • {historyItem.studentId}
                </p>
              </div>
            </div>

            {/* Timeline Section */}
            <h4 className="text-[15px] font-extrabold text-gray-900 mb-5">ไทม์ไลน์สถานะคำร้อง</h4>
            
            <div className="relative">
              <div className="absolute top-3 left-[11px] bottom-5 w-[2px] bg-[#fbcaab]"></div>

              <div className="space-y-6">
                {historyItem.timeline.map((step, idx) => (
                  <div key={idx} className="relative flex items-start gap-4">
                    <div className="relative z-10 shrink-0 mt-0.5">
                      {step.isDone ? (
                        <div className="w-6 h-6 rounded-full bg-[#ea580c] flex items-center justify-center shadow-sm">
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-white border-[4px] border-[#fbcaab] flex items-center justify-center"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-[14px] text-gray-900 mb-1 leading-tight">{step.status}</h4>
                      {step.timestamp && (
                        <p className="text-[12.5px] text-gray-500 leading-tight">
                          {step.timestamp} · โดย {step.actor}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}