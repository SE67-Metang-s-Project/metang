"use client";

import { useEffect } from "react";
import { BASE_PATH } from "@/lib/base-path";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error caught:", error);
  }, [error]);

  return (
    <html lang="th">
      <head>
        <title>เกิดข้อผิดพลาด - Me Tang</title>
      </head>
      <body className="min-h-screen bg-[#fcf9f4] flex items-center justify-center p-4 font-sans text-gray-800">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-500">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-gray-900">เกิดข้อผิดพลาดในระบบ</h1>
            <p className="text-sm text-gray-600">
              ไม่สามารถโหลดหน้านี้ได้ กรุณาลองใหม่อีกครั้ง
            </p>
            {error?.digest && (
              <p className="text-xs text-gray-400 font-mono">
                Error ID: {error.digest}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => reset()}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-colors cursor-pointer"
            >
              ลองใหม่อีกครั้ง
            </button>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = BASE_PATH || "/";
                }
              }}
              className="px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors cursor-pointer"
            >
              กลับสู่หน้าหลัก
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
