'use client';

import React from 'react';
import RequestsCard, { ActionRequest } from '../pending/RequestsaCard'; // นำเข้าคอมโพเนนต์ตารางและ Type
import { mockRequests } from '@/app/advisor/mockRequests';


export default function PendingRequestsList() {
  return (
    <div className="w-full">
      {/* Header และ ระบบค้นหา */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-900">คำร้องรอพิจารณา</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="ค้นหาเลขคำร้อง / ชื่อ / รหัสนักศึกษา"
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm w-full sm:w-72 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* เรียกใช้งานส่วนตาราง โดยส่งข้อมูล requests เข้าไป */}
      <RequestsCard requests={mockRequests} />
    </div>
  );
}