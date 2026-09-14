"use client";

import React from "react";
import { Download } from "lucide-react";
import { formatThaiBahtText } from "@/app/student/studentFormatters";
import type { ActionRequest } from "./DisburseDebtCard";

export interface LoanPetitionDocumentProps {
  request: ActionRequest;
  showDownloadButton?: boolean;
  hideBankDetails?: boolean;
  userRole?: string;
}

export function downloadLoanPetitionPdf(
  request?: { id?: string; studentId?: string; name?: string; documentUrl?: string } | null,
  isAttachment = false,
) {
  if (typeof window === "undefined" || !request) return;

  if (isAttachment && request.documentUrl) {
    const link = document.createElement("a");
    link.href = request.documentUrl;
    link.download = `เอกสารแนบ_${request.studentId || request.id || "คำร้อง"}.pdf`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  const paperEl = document.getElementById("loan-petition-document-paper");
  if (!paperEl) {
    window.print();
    return;
  }

  const studentId = request.studentId || "";
  const name = request.name || "";
  const reqId = request.id || "";
  const docTitle = `แบบคำร้องขอยืมเงินทุน_${studentId ? `${studentId}_` : ""}${name || reqId}`.trim();

  // สร้าง iframe แยกเฉพาะสำหรับพิมพ์ เพื่อป้องกันไม่ให้เนื้อหาหน้าเว็บหลักหรือ Navbar/ตาราง ดันจนเกิดหน้าขาวว่างก่อนหน้าเอกสาร
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    window.print();
    return;
  }

  const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
    .map((el) => el.outerHTML)
    .join("\n");

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="th" class="${document.documentElement.className}">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${docTitle || "แบบคำร้องขอยืมเงินทุนสวัสดิการ"}</title>
        ${styles}
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          *, *::before, *::after {
            box-sizing: border-box;
          }
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          #loan-petition-document-paper {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            position: static !important;
          }
          table {
            border-collapse: collapse !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
        </style>
      </head>
      <body class="${document.body.className}" style="background: white !important; margin: 0 !important; padding: 0 !important;">
        <div style="width: 100%; display: flex; justify-content: center; background: white;">
          ${paperEl.outerHTML}
        </div>
      </body>
    </html>
  `);
  doc.close();

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }
  };

  if (doc.readyState === "complete") {
    setTimeout(triggerPrint, 300);
  } else {
    iframe.onload = () => setTimeout(triggerPrint, 300);
  }
}

const thaiMonthsShort = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

const thaiMonthToIdx: Record<string, number> = {
  "ม.ค.": 0,
  มกราคม: 0,
  "ก.พ.": 1,
  กุมภาพันธ์: 1,
  "มี.ค.": 2,
  มีนาคม: 2,
  "เม.ย.": 3,
  เมษายน: 3,
  "พ.ค.": 4,
  พฤษภาคม: 4,
  "มิ.ย.": 5,
  มิถุนายน: 5,
  "ก.ค.": 6,
  กรกฎาคม: 6,
  "ส.ค.": 7,
  สิงหาคม: 7,
  "ก.ย.": 8,
  กันยายน: 8,
  "ต.ค.": 9,
  ตุลาคม: 9,
  "พ.ย.": 10,
  พฤศจิกายน: 10,
  "ธ.ค.": 11,
  ธันวาคม: 11,
};

const fullThaiMonths: Record<string, string> = {
  "ม.ค.": "มกราคม",
  "ก.พ.": "กุมภาพันธ์",
  "มี.ค.": "มีนาคม",
  "เม.ย.": "เมษายน",
  "พ.ค.": "พฤษภาคม",
  "มิ.ย.": "มิถุนายน",
  "ก.ค.": "กรกฎาคม",
  "ส.ค.": "สิงหาคม",
  "ก.ย.": "กันยายน",
  "ต.ค.": "ตุลาคม",
  "พ.ย.": "พฤศจิกายน",
  "ธ.ค.": "ธันวาคม",
};

export interface InstallmentRow {
  installmentNumber: number;
  dueDate: string;
  expectedAmount: number;
  isPaid: boolean;
  paidAmount: number;
  paidDate?: string;
}

const formatAmount = (amountStr: string | number) => {
  const num = Number(String(amountStr).replace(/,/g, ""));
  if (isNaN(num)) return String(amountStr);
  return num.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

export default function LoanPetitionDocument({
  request,
  showDownloadButton = false,
  hideBankDetails = false,
  userRole,
}: LoanPetitionDocumentProps) {
  const isBankDataHidden =
    hideBankDetails ||
    (userRole !== undefined && userRole !== "admin" && userRole !== "super_admin") ||
    !request.bankDetails;

  // หาข้อมูลการอนุมัติของแต่ละฝ่าย
  const advisorApproval = request.approvals?.find((a) => a.step === "advisor");
  const executiveApproval = request.approvals?.find((a) => a.step === "executive");
  const adminApproval = request.approvals?.find((a) => a.step === "admin");

  // ชื่อและข้อมูลอาจารย์ที่ปรึกษา / ผู้บริหาร / เจ้าหน้าที่ (Admin)
  const advisorName = request.advisorName || advisorApproval?.actorName || "อาจารย์ที่ปรึกษา";
  const executiveName =
    executiveApproval?.actorName || "ผู้ช่วยศาสตราจารย์ ดร.อนนท์ วิสุทธิ์ธนานนท์";

  // ประวัติการโอนเงิน (Disbursement)
  const disburseHistory = request.history?.find(
    (h) => h.action.includes("เบิกจ่าย") || h.action.includes("โอนเงิน"),
  );
  const disburseDate = disburseHistory?.date?.split(" ")?.[0] || request.submitDate;
  const disburseActor =
    disburseHistory?.actor || adminApproval?.actorName || "เจ้าหน้าที่งานบริการนักศึกษา";
  const adminName = adminApproval?.actorName || disburseActor || "เจ้าหน้าที่งานบริการนักศึกษา";

  const termsCount = Math.max(1, parseInt(String(request.term).replace(/\D/g, ""), 10) || 1);
  const totalLoanAmount = parseFloat(String(request.amount).replace(/,/g, "")) || 0;

  // ฟังก์ชันจัดรูปแบบวันที่ภาษาไทยแบบเต็ม
  const formatFullThaiDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const parts = dateStr.trim().split(" ");
    if (parts.length === 3) {
      const month = fullThaiMonths[parts[1]] || parts[1];
      return `${parts[0]} ${month} ${parts[2]}`;
    }
    return dateStr;
  };

  // ดึงหรือคำนวณงวดการผ่อนชำระ
  const installments: InstallmentRow[] = React.useMemo(() => {
    // 1. หากมีข้อมูล installments จาก database หรือ request ส่งมาโดยตรง
    if (request.installments && request.installments.length > 0) {
      return request.installments.map((inst, idx) => {
        const num = inst.installmentNumber || idx + 1;
        const paidRecord = request.paymentHistory?.find(
          (p) =>
            p.installmentNumber === num &&
            (p.status === "verified" || p.status === "confirmed" || p.status === "success"),
        );
        const isPaid = inst.isPaid ?? Boolean(paidRecord);
        const paidAmount = Number(inst.paidAmount ?? paidRecord?.amount ?? 0);
        return {
          installmentNumber: num,
          dueDate: formatFullThaiDate(inst.dueDate),
          expectedAmount: Number(inst.amount) || 0,
          isPaid,
          paidAmount: isPaid ? (paidAmount > 0 ? paidAmount : Number(inst.amount) || 0) : 0,
          paidDate: inst.paidDate || paidRecord?.paidDate || paidRecord?.paidAt,
        };
      });
    }

    // 2. คำนวณตามสูตรถ้าไม่มีข้อมูล installments ตรงๆ
    const baseAmount = Math.floor((totalLoanAmount / termsCount) * 100) / 100;
    const items: InstallmentRow[] = [];
    let allocatedTotal = 0;

    const parts = request.submitDate.trim().split(" ");
    let startDate: Date | null = null;
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const monthIdx = thaiMonthToIdx[parts[1]];
      const rawYear = parseInt(parts[2], 10);
      const year = rawYear > 2400 ? rawYear - 543 : rawYear;
      if (!isNaN(day) && monthIdx !== undefined && !isNaN(year)) {
        startDate = new Date(year, monthIdx, day);
      }
    }

    for (let i = 0; i < termsCount; i++) {
      const instNumber = i + 1;
      const isLast = i === termsCount - 1;
      const expectedAmount = isLast
        ? Math.round((totalLoanAmount - allocatedTotal) * 100) / 100
        : baseAmount;
      allocatedTotal += expectedAmount;

      let dueDateStr = "-";
      if (termsCount === 1 && request.expectedReturnDate) {
        dueDateStr = formatFullThaiDate(request.expectedReturnDate);
      } else if (startDate) {
        const nextDate = new Date(startDate);
        nextDate.setDate(startDate.getDate() + (i + 1) * 30);
        const day = nextDate.getDate();
        const month = thaiMonthsShort[nextDate.getMonth()];
        const fullMonth = fullThaiMonths[month] || month;
        const year = nextDate.getFullYear() + 543;
        dueDateStr = `${day} ${fullMonth} ${year}`;
      }

      const paidRecord = request.paymentHistory?.find(
        (p) =>
          p.installmentNumber === instNumber &&
          (p.status === "verified" || p.status === "confirmed" || p.status === "success"),
      );
      const isPaid = Boolean(paidRecord);
      const paidAmount = isPaid ? Number(paidRecord?.amount) || expectedAmount : 0;

      items.push({
        installmentNumber: instNumber,
        dueDate: dueDateStr,
        expectedAmount,
        isPaid,
        paidAmount,
        paidDate: paidRecord?.paidDate || paidRecord?.paidAt,
      });
    }

    return items;
  }, [request, termsCount, totalLoanAmount]);

  // คำนวณวันกำหนดส่งคืน
  const parseRepaymentDate = () => {
    if (request.expectedReturnDate) {
      const parts = request.expectedReturnDate.split(" ");
      if (parts.length === 3) {
        return {
          day: parts[0],
          month: fullThaiMonths[parts[1]] || parts[1],
          year: parts[2],
        };
      }
    }
    if (installments.length > 0) {
      const last = installments[installments.length - 1];
      const parts = last.dueDate.split(" ");
      if (parts.length === 3) {
        return {
          day: parts[0],
          month: parts[1],
          year: parts[2],
        };
      }
    }
    const submitParts = request.submitDate.split(" ");
    if (submitParts.length === 3) {
      return {
        day: submitParts[0],
        month: fullThaiMonths[submitParts[1]] || submitParts[1],
        year: submitParts[2],
      };
    }
    return { day: "......", month: "....................", year: ".........." };
  };

  const returnDate = parseRepaymentDate();

  return (
    <div className="w-full flex flex-col items-center">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          html, body {
            background: white !important;
            height: auto !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          #loan-petition-document-paper,
          #loan-petition-document-paper * {
            visibility: visible !important;
          }
          #loan-petition-document-paper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
          table {
            border-collapse: collapse !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {showDownloadButton && (
        <div className="w-full max-w-[800px] mb-3 flex justify-end print:hidden">
          <button
            type="button"
            onClick={() => downloadLoanPetitionPdf(request)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold text-white bg-[#ea580c] hover:bg-[#c2410c] shadow-sm hover:shadow transition-all cursor-pointer active:scale-[0.98]"
          >
            <Download size={15} />
            <span>ดาวน์โหลด PDF</span>
          </button>
        </div>
      )}

      {/* แผ่นเอกสารจำลอง A4 ตามแบบขอยืมเงินทุนสวัสดิการ.pdf */}
      <div
        id="loan-petition-document-paper"
        className="w-full max-w-[800px] bg-white border border-gray-200 rounded-xl shadow-md p-6 sm:p-10 md:p-12 text-gray-900 font-sans text-[13.5px] sm:text-[14px] leading-[2.1] print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-full print:rounded-none"
      >
        {/* หัวกระดาษ */}
        <div className="text-center mb-6 pb-2 border-b border-gray-100">
          <div className="text-[12px] font-medium text-gray-500 tracking-wider mb-1">
            คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่
          </div>
          <h1 className="text-[17px] sm:text-[19px] font-bold text-gray-900 tracking-tight">
            แบบขอยืมเงินทุนสวัสดิการนักศึกษาคณะพยาบาลศาสตร์
          </h1>
          <div className="flex justify-between items-center text-[11px] text-gray-500 mt-2">
            <span>รหัสคำร้อง: {request.id}</span>
            <span>วันที่ยื่นคำร้อง: {request.submitDate}</span>
          </div>
        </div>

        {/* ย่อหน้าที่ 1: ข้อมูลนักศึกษาผู้ขอยืม */}
        <div className="space-y-1.5 text-justify">
          <p>
            <span>ข้าพเจ้า </span>
            <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2 min-w-[200px] inline-block text-center">
              {request.name}
            </span>
            <span> หลักสูตร </span>
            <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2 min-w-[140px] inline-block text-center">
              {request.program || request.major || "พยาบาลศาสตรบัณฑิต"}
            </span>
            <span> ชั้นปีที่ </span>
            <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2 min-w-[40px] inline-block text-center">
              {request.year}
            </span>
            <span> เบอร์โทรศัพท์ติดต่อ </span>
            <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2 min-w-[130px] inline-block text-center">
              {request.phone || "-"}
            </span>
            <span> มีความประสงค์จะขอยืมเงินทุนสวัสดิการนักศึกษาคณะพยาบาลศาสตร์ จำนวน </span>
            <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2 min-w-[100px] inline-block text-center">
              {formatAmount(request.amount)}
            </span>
            <span> บาท (</span>
            <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2 min-w-[180px] inline-block text-center">
              {formatThaiBahtText(String(request.amount))}
            </span>
            <span>) เพื่อนำไปใช้ </span>
            <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2 min-w-[280px] inline-block text-left">
              {request.objective}
              {request.additionalNote ? ` (${request.additionalNote})` : ""}
            </span>
          </p>

          {!isBankDataHidden && (
            <p>
              <span>โอนเข้าบัญชี ธนาคาร </span>
              <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2 min-w-[120px] inline-block text-center">
                {request.bankDetails?.bankName || "-"}
              </span>
              <span> เลขที่บัญชี </span>
              <span className="font-semibold font-mono text-gray-900 border-b border-dotted border-gray-400 px-2 min-w-[150px] inline-block text-center">
                {request.bankDetails?.accountNumber || "-"}
              </span>
              <span> ชื่อบัญชี </span>
              <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2 min-w-[200px] inline-block text-center">
                {request.bankDetails?.accountName || request.name}
              </span>
            </p>
          )}
        </div>

        {/* ย่อหน้าที่ 2: ระเบียบและข้อตกลงการยืมเงิน */}
        <div className="mt-4 text-justify">
          <p>
            ข้าพเจ้าได้ทราบระเบียบการยืมเงินกองทุนสวัสดิการ และยินดีปฏิบัติตามทุกประการ ข้าพเจ้าจะนำเงิน
            จำนวน{" "}
            <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2 min-w-[90px] inline-block text-center">
              {formatAmount(request.amount)}
            </span>{" "}
            บาท (
            <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2 min-w-[160px] inline-block text-center">
              {formatThaiBahtText(String(request.amount))}
            </span>
            ) มาใช้คืนแก่กองทุนสวัสดิการนักศึกษาคณะพยาบาลศาสตร์ ภายในวันที่{" "}
            <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2 min-w-[35px] inline-block text-center">
              {returnDate.day}
            </span>{" "}
            เดือน{" "}
            <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2 min-w-[90px] inline-block text-center">
              {returnDate.month}
            </span>{" "}
            พ.ศ.{" "}
            <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2 min-w-[50px] inline-block text-center">
              {returnDate.year}
            </span>{" "}
            {termsCount > 1
              ? `โดยตกลงแบ่งชำระเป็นจำนวน ${termsCount} งวด ตามกำหนดการผ่อนชำระดังต่อไปนี้`
              : "โดยมีกำหนดการผ่อนชำระดังต่อไปนี้"}
          </p>
        </div>

        {/* ตารางกำหนดการผ่อนชำระ */}
        <div className="mt-3.5 mb-3">
          <div className="text-[13px] sm:text-[13.5px] font-bold text-gray-900 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>กำหนดการผ่อนชำระ</span>
              <span className="text-[12px] font-normal text-gray-600">
                (จำนวน {termsCount} งวด)
              </span>
            </span>
            <span className="text-[12px] font-normal text-gray-500">
              ยอดรวมทั้งสิ้น {formatAmount(request.amount)} บาท
            </span>
          </div>

          <div className="overflow-hidden border border-gray-300 rounded-md">
            <table className="w-full text-left border-collapse text-[12.5px] sm:text-[13px] leading-relaxed">
              <thead>
                <tr className="bg-gray-50 text-gray-700 border-b border-gray-300 font-semibold text-center">
                  <th className="py-1.5 px-3 w-[20%] border-r border-gray-200">งวดที่</th>
                  <th className="py-1.5 px-4 text-left w-[50%] border-r border-gray-200">
                    กำหนดชำระภายในวันที่
                  </th>
                  <th className="py-1.5 px-4 text-right w-[30%]">
                    จำนวนเงิน (บาท)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {installments.map((inst) => (
                  <tr key={inst.installmentNumber} className="hover:bg-gray-50/50">
                    <td className="py-1.5 px-3 text-center font-medium text-gray-800 border-r border-gray-200">
                      งวดที่ {inst.installmentNumber}
                    </td>
                    <td className="py-1.5 px-4 text-gray-800 border-r border-gray-200">
                      {inst.dueDate}
                    </td>
                    <td className="py-1.5 px-4 text-right font-semibold text-gray-900">
                      {formatAmount(inst.expectedAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 text-gray-900 border-t border-gray-300 font-semibold text-[12px] sm:text-[12.5px]">
                  <td colSpan={2} className="py-1.5 px-4 text-right border-r border-gray-200">
                    รวมทั้งสิ้น ({formatThaiBahtText(String(request.amount))})
                  </td>
                  <td className="py-1.5 px-4 text-right font-bold text-gray-900">
                    {formatAmount(request.amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="mt-2 text-justify">
          <p>
            หากข้าพเจ้ามิได้นำเงินจำนวนดังกล่าวมาคืนให้ตามกำหนดเวลาแล้ว
            ข้าพเจ้ายินดีให้คณะพยาบาลศาสตร์ดำเนินการตามที่เห็นสมควร
          </p>
        </div>

        {/* ส่วนลายมือชื่อ (ใต้ข้อตกลง) */}
        <div className="mt-4 flex justify-end">
          <div className="w-full sm:w-auto text-right sm:text-left sm:min-w-[280px] space-y-3">
            <div>
              <div className="flex items-center justify-end sm:justify-start gap-1">
                <span>(ลงชื่อ)</span>
                <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-3 min-w-[160px] text-center inline-block">
                  {request.name}
                </span>
                <span>ผู้ยืม</span>
              </div>
              <div className="text-[12px] text-gray-500 pl-10 text-center sm:text-left">
                วันที่ {request.submitDate}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-end sm:justify-start gap-1">
                <span>(ลงชื่อ)</span>
                <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-3 min-w-[160px] text-center inline-block">
                  {adminName}
                </span>
                <span>พยาน</span>
              </div>
              <div className="text-[12px] text-gray-500 pl-10 text-center sm:text-left">
                วันที่ {adminApproval?.date || request.submitDate}
              </div>
            </div>
          </div>
        </div>

        {/* เส้นประคั่นกลางหน้ากระดาษ */}
        <hr className="border-t-2 border-dotted border-gray-300 my-6" />

        {/* ส่วนล่าง: ความคิดเห็นการพิจารณา & หลักฐานการรับเงิน (ไม่ทำเป็นกล่อง) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* คอลัมน์ซ้าย: ความคิดเห็นอาจารย์ที่ปรึกษา & admin */}
          <div className="space-y-8">
            {/* 1. ความคิดเห็นของอาจารย์ที่ปรึกษา */}
            <div className="space-y-2">
              <div className="font-bold text-gray-900 text-[14px]">
                ความคิดเห็นของอาจารย์ที่ปรึกษา
              </div>
              <p className="text-[13px] text-gray-800 italic min-h-[36px] py-1">
                &ldquo;{advisorApproval?.comment || "เห็นควรให้การสนับสนุนการขอยืมเงินทุนสวัสดิการเพื่อการศึกษา"}&rdquo;
              </p>
              <div className="text-center pt-1">
                <div className="flex items-center justify-center gap-1">
                  <span>(ลงชื่อ)</span>
                  <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2 min-w-[140px] inline-block">
                    {advisorName}
                  </span>
                </div>
                <div className="text-[12px] text-gray-600 mt-0.5">
                  ({advisorName})
                </div>
                <div className="text-[11px] text-gray-500">
                  อาจารย์ที่ปรึกษา · วันที่ {advisorApproval?.date || request.submitDate}
                </div>
              </div>
            </div>

            {/* 2. ความคิดเห็นของ admin */}
            <div className="space-y-2">
              <div className="font-bold text-gray-900 text-[14px]">
                ความคิดเห็นของ admin
              </div>
              <p className="text-[13px] text-gray-800 italic min-h-[36px] py-1">
                &ldquo;{adminApproval?.comment || "ตรวจสอบเอกสารและคุณสมบัติครบถ้วน ถูกต้องตามระเบียบ"}&rdquo;
              </p>
              <div className="text-center pt-1">
                <div className="flex items-center justify-center gap-1">
                  <span>(ลงชื่อ)</span>
                  <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2 min-w-[140px] inline-block">
                    {adminName}
                  </span>
                </div>
                <div className="text-[12px] text-gray-600 mt-0.5">
                  ({adminName})
                </div>
                <div className="text-[11px] text-gray-500">
                  เจ้าหน้าที่ · วันที่ {adminApproval?.date || request.submitDate}
                </div>
              </div>
            </div>
          </div>

          {/* คอลัมน์ขวา: ความคิดเห็นของผู้บริหาร & ได้รับเงินเรียบร้อยแล้ว */}
          <div className="space-y-8">
            {/* 3. ความคิดเห็นของผู้บริหาร */}
            <div className="space-y-2">
              <div className="font-bold text-gray-900 text-[14px]">
                ความคิดเห็นของผู้บริหาร
              </div>
              <p className="text-[13px] text-gray-800 italic min-h-[36px] py-1">
                &ldquo;{executiveApproval?.comment || "อนุมัติให้ขอยืมเงินทุนสวัสดิการนักศึกษาตามระเบียบ"}&rdquo;
              </p>
              <div className="text-center pt-1">
                <div className="flex items-center justify-center gap-1">
                  <span>(ลงชื่อ)</span>
                  <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2 min-w-[150px] inline-block">
                    {executiveName}
                  </span>
                </div>
                <div className="text-[12px] font-semibold text-gray-800 mt-0.5">
                  ({executiveName})
                </div>
                <div className="text-[11px] text-gray-600">ผู้บริหารคณะพยาบาลศาสตร์</div>
                <div className="text-[11px] text-gray-500">
                  วันที่ {executiveApproval?.date || request.submitDate}
                </div>
              </div>
            </div>

            {/* 4. ได้รับเงินเรียบร้อยแล้ว */}
            <div className="space-y-2">
              <div className="font-bold text-gray-900 text-[14px]">
                ได้รับเงินเรียบร้อยแล้ว
              </div>

              <div className="space-y-2.5 pt-1">
                <div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-gray-700">(ลงชื่อ)</span>
                    <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2 min-w-[130px] text-center">
                      {request.name}
                    </span>
                    <span className="text-gray-700">ผู้ยืม</span>
                  </div>
                  <div className="text-[11px] text-gray-500 text-right pr-8 mt-0.5">
                    วันที่ {disburseDate}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-gray-700">(ลงชื่อ)</span>
                    <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400 px-2 min-w-[130px] text-center">
                      {disburseActor}
                    </span>
                    <span className="text-gray-700">ผู้จ่าย</span>
                  </div>
                  <div className="text-[11px] text-gray-500 text-right pr-8 mt-0.5">
                    วันที่ {disburseDate}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
