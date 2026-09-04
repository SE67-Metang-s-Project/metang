import React from "react";
// Import ให้ชื่อตรงกับที่ Export มาจากไฟล์ เพื่อลดความสับสน
import VerifySlipPage from "@/components/admin/verify-slip/AdminVerifySlipPage";

export default function Page() {
  // เรียกใช้งานหน้า VerifySlipPage ที่รวม Layout (Sidebar, TopNav) ไว้แล้วได้เลย
  return <VerifySlipPage />;
}