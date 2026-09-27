"use client";

import React, { useEffect, useRef, useState } from "react";
import { FileText, Download, Minus, RotateCcw, Plus, X } from "lucide-react";
import { useModalDismiss } from "@/hooks/useBodyScrollLock";
import LoanPetitionDocument, {
  downloadLoanPetitionPdf,
} from "@/components/shared/disburse-debt/LoanPetitionDocument";
import type { ActionRequest } from "@/components/shared/disburse-debt/DisburseDebtCard";
import {
  localizeStudentContent,
  useStudentLanguage,
} from "@/app/student/StudentLanguageProvider";

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
  const { language, t } = useStudentLanguage();
  const [documentViewTab, setDocumentViewTab] = useState<"official" | "attachment">("official");
  const [zoom, setZoom] = useState(0.5);
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const modalDismiss = useModalDismiss({
    onClose,
    isOpen,
  });

  useEffect(() => {
    const viewport = previewViewportRef.current;
    if (!isOpen || !viewport || documentViewTab !== "official") return;

    const fitDocument = () => {
      // CSS A4 is 793.7 × 1122.5 pixels. Leave room for the viewport padding so the entire
      // document is visible initially, rather than requiring a side-scroll to reach its edge.
      const nextZoom = Math.min(
        1,
        Math.max(0.25, (viewport.clientWidth - 16) / 793.7, (viewport.clientHeight - 76) / 1122.5),
      );
      setZoom(nextZoom);
    };

    fitDocument();
    const observer = new ResizeObserver(fitDocument);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [documentViewTab, isOpen]);

  if (!isOpen || !request) return null;

  const studentName =
    language === "en"
      ? request.nameEn || localizeStudentContent(request.name, language)
      : request.name;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm print:p-0 print:bg-white"
      {...modalDismiss}
      role="presentation"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col h-[88vh] sm:h-[92vh] overflow-hidden relative border border-gray-200 animate-in fade-in zoom-in-95 duration-200 print:h-auto print:max-w-full print:border-none print:shadow-none">
        {/* Header ของ Modal เอกสาร */}
        <div className="flex justify-between items-center px-5 sm:px-6 py-4 border-b border-gray-100 bg-white shrink-0 print:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-orange-100 text-[#ea580c] p-2 rounded-lg">
              <FileText size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 leading-tight">
                {t("แบบขอยืมเงินทุนสวัสดิการ", "Loan Request")}
              </h2>
              <p className="mt-0.5 flex flex-col text-[13px] text-gray-500">
                <span>{t("รหัสคำร้อง:", "Request ID:")} {request.id}</span>
                <span className="break-words">{studentName}</span>
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
                  {t("แบบฟอร์มทางการ", "Official form")}
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
                  {t("ไฟล์แนบต้นฉบับ", "Original attachment")}
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors cursor-pointer"
              aria-label={t("ปิดหน้าต่าง", "Close window")}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ส่วนแสดงเนื้อหาเอกสาร */}
        <div
          ref={previewViewportRef}
          className="relative flex-1 overflow-auto bg-gray-100/90 p-4 sm:p-6 print:bg-white print:p-0"
        >
          {request.documentUrl && documentViewTab === "attachment" ? (
            <iframe
              src={request.documentUrl}
              className="w-full h-full min-h-[500px] rounded-xl border border-gray-300 shadow-sm bg-white"
              title={t("เอกสารคำร้อง", "Request document")}
            />
          ) : (
            <div
              className="mx-auto shrink-0"
              style={{ height: `${1122.5 * zoom}px`, width: `${793.7 * zoom}px` }}
            >
              <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: "210mm" }}>
                <LoanPetitionDocument
                  request={request}
                  hideBankDetails={hideBankDetails}
                  userRole={userRole}
                />
              </div>
            </div>
          )}

          {documentViewTab === "official" && (
            <div className="sticky bottom-0 mt-3 flex justify-center print:hidden">
              <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white/95 p-1 shadow-lg backdrop-blur">
                <button
                  aria-label={t("ซูมออก", "Zoom out")}
                  className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  disabled={zoom <= 0.25}
                  onClick={() => setZoom((value) => Math.max(0.25, value - 0.1))}
                  type="button"
                >
                  <Minus size={16} />
                </button>
                <span className="min-w-12 text-center text-xs font-semibold text-gray-600">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  aria-label={t("ซูมเข้า", "Zoom in")}
                  className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  disabled={zoom >= 1.5}
                  onClick={() => setZoom((value) => Math.min(1.5, value + 0.1))}
                  type="button"
                >
                  <Plus size={16} />
                </button>
                <button
                  aria-label={t("พอดีหน้าต่าง", "Fit to window")}
                  className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                  onClick={() => {
                    const viewport = previewViewportRef.current;
                    if (!viewport) return;
                    setZoom(
                      Math.min(
                        1,
                        Math.max(
                          0.25,
                          (viewport.clientWidth - 16) / 793.7,
                          (viewport.clientHeight - 76) / 1122.5,
                        ),
                      ),
                    );
                  }}
                  type="button"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-gray-100 flex justify-between items-center shrink-0 print:hidden">
          <span className="text-[11px] sm:text-xs text-gray-500 hidden sm:inline">
            {t(
              "แบบฟอร์มทางการกองทุนสวัสดิการนักศึกษา คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่",
              "Official student welfare fund form, Faculty of Nursing, Chiang Mai University",
            )}
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() =>
                downloadLoanPetitionPdf(request, documentViewTab === "attachment")
              }
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-[#ea580c] hover:bg-[#c2410c] shadow-sm hover:shadow transition-all cursor-pointer active:scale-[0.98]"
            >
              <Download size={15} />
              <span>{t("ดาวน์โหลด PDF", "Download PDF")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
