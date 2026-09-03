import { PaymentTransaction } from "@/components/admin/verify-slip/VerifySlipCard";

export const mockPendingSlips: PaymentTransaction[] = [
  {
    id: "TXN-650012",
    studentId: "65010001",
    studentName: "สมชาย ใจดี",
    installmentNumber: 2,
    amount: "4500",
    transferDate: "15 ก.ย. 2567",
    transferTime: "14:30",
    bankFrom: "ธนาคารไทยพาณิชย์ (SCB)",
    bankTo: "บัญชีคณะพยาบาลศาสตร์ มช.",
    slipImageUrl: "https://placehold.co/400x600/eeeeee/888888?text=Slip+Image+1", 
    status: "pending",
    submittedAt: "15 ก.ย. 2567 14:35 น."
  },
  {
    id: "TXN-660045",
    studentId: "66010002",
    studentName: "มานี มีนา",
    installmentNumber: 1,
    amount: "2000",
    transferDate: "14 ก.ย. 2567",
    transferTime: "09:15",
    bankFrom: "ธนาคารกสิกรไทย (KBANK)",
    bankTo: "บัญชีคณะพยาบาลศาสตร์ มช.",
    slipImageUrl: "https://placehold.co/400x600/eeeeee/888888?text=Slip+Image+2", 
    status: "pending",
    submittedAt: "14 ก.ย. 2567 09:20 น."
  }
];