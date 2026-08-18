// การ์ดแสดงประวัติ 1 รายการ พร้อมไทม์ไลน์

import React from 'react';
import { Check } from 'lucide-react';

type TimelineStep = {
  status: string;
  timestamp: string;
  actor: string;
  isDone: boolean;
};

type HistoryItem = {
  requestId: string;
  studentName: string;
  studentId: string;
  timeline: TimelineStep[];
};

type HistoryCardProps = {
  historyItem: HistoryItem;
  onClick: () => void;
};

export default function HistoryCard({ historyItem, onClick }: HistoryCardProps) {
  return (
    <div 
      onClick={onClick}
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
      <h4 className="text-[17px] font-extrabold text-gray-900 mb-5">ไทม์ไลน์สถานะคำร้อง</h4>
      
      <div className="relative">
        {/* เส้นแกนกลาง */}
        <div className="absolute top-3 left-[11px] bottom-5 w-[2px] bg-[#fbcaab]"></div>

        <div className="space-y-6">
          {historyItem.timeline.map((step, idx) => (
            <div key={idx} className="relative flex items-start gap-4">
              <div className="relative z-10 shrink-0 mt-0.5">
                {step.isDone ? (
                  <div className="w-6 h-6 rounded-full bg-[#f89558] flex items-center justify-center shadow-sm">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-white border-[4px] border-[#fbc093] flex items-center justify-center"></div>
                )}
              </div>

              <div className="flex-1">
                <h4 className="font-bold text-[14.5px] text-gray-900 mb-1 leading-tight">{step.status}</h4>
                {step.timestamp && (
                  <p className="text-[13px] text-gray-500 leading-tight">
                    {step.timestamp} · โดย {step.actor}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}