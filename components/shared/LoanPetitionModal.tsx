"use client";

import React, { useState } from "react";
import { FileText, Download, X } from "lucide-react";
import { useModalDismiss } from "@/hooks/useBodyScrollLock";
import LoanPetitionDocument, {
  downloadLoanPetitionPdf,
} from "@/components/shared/disburse-debt/LoanPetitionDocument";
import type { ActionRequest } from "@/components/shared/disburse-debt/DisburseDebtCard";

export interface LoanPetitionModalProps {
  request: ActionRequest | null;
  isOpen: boolean;
  onClose: () => void;
  hideBankDetails?: boolean;
  userRole?: string;
}

export default function LoanPetitionModal({
  request,
  isOpen,
  onClose,
  hideBankDetails = false,
  userRole,
}: LoanPetitionModalProps) {
  const [documentViewTab, setDocumentViewTab] = useState<"official" | "attachment">("official");
  const modalDismiss = useModalDismiss({
    onClose,
    isOpen,
  });

  if (!isOpen || !request) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm print:p-0 print:bg-white"
      {...modalDismiss}
      role="presentation"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col h-[88vh] sm:h-[92vh] overflow-hidden relative border border-gray-200 animate-in fade-in zoom-in-95 duration-200 print:h-auto print:max-w-full print:border-none print:shadow-none">
        {/* Header ของ Modal เอกสาร */}
        <div className="flex justify-between items-center px-5 sm:px-6 py-4 border-b border-gray-100 bg-white shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 text-[#ea580c] p-2 rounded-lg">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                แบบขอยืมเงินทุนสวัสดิการ
              </h2>
              <p className="text-[13px] text-gray-500 mt-0.5">
                รหัสคำร้อง: {request.id} • {request.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* แถบเลือกสลับระหว่างแบบฟอร์มทางการ และไฟล์แนบ (หากมี) */}
            {request.documentUrl && (
              <div className="flex rounded-lg bg-gray-100 p-0.5 border border-gray-200 text-xs">
                <button
                  type="button"
                  onClick={() => setDocumentViewTab("official")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    documentViewTab === "official"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  แบบฟอร์มทางการ
                </button>
                <button
                  type="button"
                  onClick={() => setDocumentViewTab("attachment")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    documentViewTab === "attachment"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  ไฟล์แนบต้นฉบับ
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors cursor-pointer"
              aria-label="ปิดหน้าต่าง"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ส่วนแสดงเนื้อหาเอกสาร */}
        <div className="flex-1 bg-gray-100/90 p-4 sm:p-6 overflow-y-auto print:bg-white print:p-0">
          {request.documentUrl && documentViewTab === "attachment" ? (
            <iframe
              src={request.documentUrl}
              className="w-full h-full min-h-[500px] rounded-xl border border-gray-300 shadow-sm bg-white"
              title="Petition Document"
            />
          ) : (
            <LoanPetitionDocument
              request={request}
              hideBankDetails={hideBankDetails}
              userRole={userRole}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-gray-100 flex justify-between items-center shrink-0 print:hidden">
          <span className="text-[11px] sm:text-xs text-gray-500 hidden sm:inline">
            แบบฟอร์มทางการกองทุนสวัสดิการนักศึกษา คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() =>
                downloadLoanPetitionPdf(request, documentViewTab === "attachment")
              }
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold text-white bg-[#ea580c] hover:bg-[#c2410c] shadow-sm hover:shadow transition-all cursor-pointer active:scale-[0.98]"
            >
              <Download size={15} />
              <span>ดาวน์โหลด PDF</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl text-[13px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer text-center active:scale-[0.98]"
              type="button"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
