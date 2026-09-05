"use client";

import React from "react";
import SharedDisburseDebtList from "@/components/shared/disburse-debt/SharedDisburseDebtList";
import type { ActionRequest } from "@/components/shared/disburse-debt/DisburseDebtCard";

interface DisburseDebtPageProps {
  initialRequests?: ActionRequest[];
}

export default function DisburseDebtPage({ initialRequests }: DisburseDebtPageProps) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b] mb-1">
          เบิกจ่ายเงินให้นักศึกษา (Disbursement)
        </h1>
        <p className="text-[13px] text-gray-500">
          รายการคำร้องที่ผ่านการอนุมัติจากผู้บริหารแล้ว
          กรุณาโอนเงินและแนบสลิปเพื่อยืนยันการเบิกจ่าย
        </p>
      </div>

      <SharedDisburseDebtList userRole="admin" initialRequests={initialRequests} />
    </div>
  );
}
