"use client";

import React from "react";
import { X } from "lucide-react";
import { StudentLanguageProvider } from "@/app/student/StudentLanguageProvider";
import { useModalDismiss } from "@/hooks/useBodyScrollLock";
import PaymentEvidenceHistory from "./PaymentEvidenceHistory";
import type { Student } from "./StudentListItem";

type StudentPaymentHistoryModalProps = {
  student: Student;
  onClose: () => void;
};

export default function StudentPaymentHistoryModal({
  student,
  onClose,
}: StudentPaymentHistoryModalProps) {
  const backdropDismiss = useModalDismiss({ onClose });

  return (
    <StudentLanguageProvider defaultLanguage="th">
      <div
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
        {...backdropDismiss}
        role="dialog"
      >
        <section
          aria-labelledby="student-detail-title"
          className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-gray-50 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 bg-white px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900" id="student-detail-title">
                {student.name}
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                {student.studentId} · {student.major} · ชั้นปี {student.year}
              </p>
            </div>
            <button
              aria-label="ปิดรายละเอียดนักศึกษา"
              className="rounded-full bg-gray-50 p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
              onClick={onClose}
              type="button"
            >
              <X aria-hidden="true" size={20} />
            </button>
          </header>
          <div className="space-y-4 p-4 sm:p-6">
            <PaymentEvidenceHistory payments={student.paymentHistory} />
          </div>
        </section>
      </div>
    </StudentLanguageProvider>
  );
}
